import json
from unittest.mock import MagicMock, patch

import pytest
from django.test import RequestFactory
from django.urls import reverse

from portal.apps.public_data.views import (
    LICENSE_URLS,
    PublicationFileDownloadView,
    SchemaOrgValidationError,
    _format_citation_author,
    _format_citation_date,
    _format_content_size,
    _get_citation_pdf_url,
    _get_citations,
    _get_cite_as,
    _get_configured_origin,
    _get_cover_image_url,
    _get_distribution,
    _get_landing_page_url,
    _get_license,
    _get_orcid_same_as,
    _get_publication_file_url,
    _get_record_sets,
    dumps_json_ld,
    get_citation_context,
    get_schema_org_json,
)
from portal.apps.publications.models import Publication

# `PORTAL_PUBLICATION_DATACITE_URL_PREFIX` isn't defined at all in unit_test_settings.py (unlike
# every real settings_custom module, which always sets `_PORTAL_PUBLICATION_DATACITE_URL_PREFIX`
# and so always ends up with a value -- even if None -- via settings.py's getattr default). Any
# test that reaches `_get_configured_origin` needs this attribute to exist, so define it here for
# every test in this module rather than special-casing each one.
pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _datacite_url_prefix(settings):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = ""


@pytest.fixture
def rf():
    return RequestFactory()


def make_request(rf, path="/"):
    return rf.get(path)


def full_author(orcid="0000-0002-1825-0097"):
    return {"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "orcid": orcid}


def valid_base_meta(**overrides):
    meta = {
        "title": "Test Dataset",
        "description": "A dataset for testing",
        "license": "ODC-BY 1.0",
        "authors": [full_author()],
        "publicationDate": "2024-05-01",
        "doi": "10.1234/test-doi",
        "institution": "Test University",
        "keywords": "alpha, beta",
        "coverImage": "/cover.png",
        "fileObjs": [
            {
                "type": "file",
                "name": "data.csv",
                "path": "/data.csv",
                "length": 2048,
                "sha256": "abc123",
                "columns": [{"name": "col1", "dataType": "sc:Text"}],
            }
        ],
        "relatedPublications": [
            {
                "publicationType": "context",
                "publicationTitle": "A related paper",
                "publicationAuthor": "Someone Else",
                "publicationDateOfPublication": "2023-01-01",
                "publicationLink": "https://example.com/paper",
                "publicationDoi": "10.9999/related",
                "publicationPublisher": "Related Press",
            }
        ],
    }
    meta.update(overrides)
    return meta


@pytest.fixture
def publication(db):
    return Publication.objects.create(
        project_id="test.project-1",
        value=valid_base_meta(),
        tree={},
        version=3,
    )


# ---------------------------------------------------------------------------
# _get_license
# ---------------------------------------------------------------------------


def test_get_license_passes_through_existing_url():
    assert _get_license({"license": "https://example.com/license"}, "p1") == "https://example.com/license"
    assert _get_license({"license": "http://example.com/license"}, "p1") == "http://example.com/license"


def test_get_license_resolves_known_label():
    assert _get_license({"license": "ODC-BY 1.0"}, "p1") == LICENSE_URLS["ODC-BY 1.0"]


def test_get_license_raises_for_unmapped_label():
    with pytest.raises(SchemaOrgValidationError, match="unmapped-license"):
        _get_license({"license": "unmapped-license"}, "p1")


@pytest.mark.parametrize("base_meta", [{}, {"license": None}, {"license": ""}])
def test_get_license_falsy_passthrough(base_meta):
    assert _get_license(base_meta, "p1") == base_meta.get("license")


# ---------------------------------------------------------------------------
# _get_orcid_same_as
# ---------------------------------------------------------------------------


def test_get_orcid_same_as_url_passthrough():
    author = {"orcid": "https://orcid.org/0000-0002-1825-0097"}
    assert _get_orcid_same_as(author) == "https://orcid.org/0000-0002-1825-0097"


@pytest.mark.parametrize("orcid", ["0000-0002-1825-0097", "0000-0002-1825-000X"])
def test_get_orcid_same_as_valid_raw_id(orcid):
    assert _get_orcid_same_as({"orcid": orcid}) == f"https://orcid.org/{orcid}"


@pytest.mark.parametrize("orcid", ["not-an-orcid", "1234-5678-9012", "0000-0002-1825-00977"])
def test_get_orcid_same_as_invalid_format(orcid):
    assert _get_orcid_same_as({"orcid": orcid}) is None


@pytest.mark.parametrize("author", [{}, {"orcid": ""}, {"orcid": "  "}])
def test_get_orcid_same_as_missing(author):
    assert _get_orcid_same_as(author) is None


# ---------------------------------------------------------------------------
# _get_configured_origin
# ---------------------------------------------------------------------------


def test_get_configured_origin_uses_configured_absolute_prefix(rf, settings):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://cep.test/data/tapis/projects/x"
    request = make_request(rf)
    assert _get_configured_origin(request) == "https://cep.test"


def test_get_configured_origin_falls_back_to_request_host(rf, settings):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = ""
    request = make_request(rf)
    assert _get_configured_origin(request) == "http://testserver"


def test_get_configured_origin_falls_back_when_prefix_not_absolute(rf, settings):
    # A bare path (no scheme/netloc) is "set" but not usable as an origin.
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "/just/a/path"
    request = make_request(rf)
    assert _get_configured_origin(request) == "http://testserver"


# ---------------------------------------------------------------------------
# _format_content_size
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "num_bytes,expected",
    [
        (0, "0 B"),
        (500, "500 B"),
        (1023, "1023 B"),
        (2048, "2.0 KB"),
        (1024 * 1024, "1.0 MB"),
        (1024 * 1024 * 1024, "1.0 GB"),
        (1024**4, "1.0 TB"),
        (1024**5, "1024.0 TB"),
    ],
)
def test_format_content_size(num_bytes, expected):
    assert _format_content_size(num_bytes) == expected


# ---------------------------------------------------------------------------
# _get_distribution
# ---------------------------------------------------------------------------


def test_get_distribution_builds_file_objects(rf):
    request = make_request(rf)
    base_meta = {
        "fileObjs": [
            {
                "type": "file",
                "name": "data.csv",
                "path": "/data.csv",
                "length": 2048,
                "sha256": "abc123",
            }
        ]
    }
    distribution = _get_distribution(base_meta, "test.project-1", request)
    assert len(distribution) == 1
    file_object = distribution[0]
    assert file_object["@type"] == "cr:FileObject"
    assert file_object["@id"] == "data.csv"
    assert file_object["name"] == "data.csv"
    assert (
        file_object["contentUrl"]
        == "http://testserver/api/datafiles/tapis/download/projects/test.project.published.test.project-1/data.csv/"
    )
    assert file_object["encodingFormat"] == "text/csv"
    assert file_object["contentSize"] == "2.0 KB"
    assert file_object["sha256"] == "abc123"


def test_get_distribution_skips_non_file_and_incomplete_entries(rf):
    request = make_request(rf)
    base_meta = {
        "fileObjs": [
            {"type": "dir", "name": "folder", "path": "/folder"},
            {"type": "file", "name": "", "path": "/no-name.csv"},
            {"type": "file", "name": "no-path.csv", "path": ""},
        ]
    }
    assert _get_distribution(base_meta, "test.project-1", request) == []


def test_get_distribution_percent_encodes_path_and_defaults_encoding_format(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "weird.unknownext", "path": "sub dir/data file.bin"}]}
    distribution = _get_distribution(base_meta, "test.project-1", request)
    file_object = distribution[0]
    assert file_object["@id"] == "sub%20dir/data%20file.bin"
    assert file_object["contentUrl"].endswith("/sub%20dir/data%20file.bin/")
    assert file_object["encodingFormat"] == "application/octet-stream"
    assert "contentSize" not in file_object
    assert "sha256" not in file_object


# ---------------------------------------------------------------------------
# _get_cover_image_url
# ---------------------------------------------------------------------------


def test_get_cover_image_url_none_without_cover_image(rf, settings):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    request = make_request(rf)
    assert _get_cover_image_url({}, request) is None


def test_get_cover_image_url_none_without_root_system(rf, settings):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = None
    request = make_request(rf)
    assert _get_cover_image_url({"coverImage": "/cover.png"}, request) is None


def test_get_cover_image_url_builds_url(rf, settings):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    request = make_request(rf)
    url = _get_cover_image_url({"coverImage": "/cover.png"}, request)
    assert url == "http://testserver/api/datafiles/tapis/download/projects/root.system/cover.png/"


# ---------------------------------------------------------------------------
# _get_record_sets
# ---------------------------------------------------------------------------


def test_get_record_sets_skips_missing_columns_or_path():
    base_meta = {
        "fileObjs": [
            {"path": "/no-columns.csv"},
            {"columns": [{"name": "a"}], "path": ""},
        ]
    }
    assert _get_record_sets(base_meta) == []


def test_get_record_sets_builds_fields_and_skips_unnamed_columns():
    base_meta = {
        "fileObjs": [
            {
                "name": "data.csv",
                "path": "/data.csv",
                "columns": [{"name": "col1", "dataType": "sc:Integer"}, {"name": ""}, {}],
            }
        ]
    }
    record_sets = _get_record_sets(base_meta)
    assert len(record_sets) == 1
    record_set = record_sets[0]
    assert record_set["@type"] == "cr:RecordSet"
    assert record_set["@id"] == "data.csv/records"
    assert record_set["name"] == "data.csv"
    assert len(record_set["field"]) == 1
    field = record_set["field"][0]
    assert field["@id"] == "data.csv/col1"
    assert field["name"] == "col1"
    assert field["dataType"] == "sc:Integer"
    assert field["source"] == {"fileObject": {"@id": "data.csv"}, "extract": {"column": "col1"}}


def test_get_record_sets_default_data_type():
    base_meta = {"fileObjs": [{"name": "data.csv", "path": "/data.csv", "columns": [{"name": "col1"}]}]}
    field = _get_record_sets(base_meta)[0]["field"][0]
    assert field["dataType"] == "sc:Text"


# ---------------------------------------------------------------------------
# _get_landing_page_url / _get_publication_file_url
# ---------------------------------------------------------------------------


def test_get_landing_page_url(rf):
    request = make_request(rf)
    url = _get_landing_page_url("test.project-1", request)
    assert url == "http://testserver" + reverse("publications:index", kwargs={"project_id": "test.project-1"})


def test_get_landing_page_url_respects_configured_origin(rf, settings):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://cep.test/data"
    request = make_request(rf)
    url = _get_landing_page_url("test.project-1", request)
    assert url.startswith("https://cep.test/published-datasets/")


def test_get_publication_file_url(rf):
    request = make_request(rf)
    url = _get_publication_file_url("test.project-1", "sub dir/data file.pdf", request)
    expected_path = reverse(
        "publications:file_download", kwargs={"project_id": "test.project-1", "path": "sub dir/data file.pdf"}
    )
    assert url == "http://testserver" + expected_path


# ---------------------------------------------------------------------------
# _get_cite_as
# ---------------------------------------------------------------------------


def test_get_cite_as_full_citation(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": [full_author()], "publicationDate": "2024-05-01", "title": "Test Dataset"}
    citation = _get_cite_as(base_meta, "10.1234/test-doi", "test.project-1", request)
    assert citation == "Ada Lovelace. (2024). Test Dataset. Test Publisher. https://doi.org/10.1234/test-doi"


def test_get_cite_as_falls_back_to_landing_page_without_doi(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": [], "title": "Test Dataset"}
    citation = _get_cite_as(base_meta, None, "test.project-1", request)
    landing_page = _get_landing_page_url("test.project-1", request)
    assert citation == f"Test Dataset. Test Publisher. {landing_page}"


def test_get_cite_as_omits_missing_parts(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = None
    request = make_request(rf)
    base_meta = {}
    citation = _get_cite_as(base_meta, None, "test.project-1", request)
    landing_page = _get_landing_page_url("test.project-1", request)
    assert citation == landing_page


def test_get_cite_as_skips_authors_without_last_name(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": [{"first_name": "NoLastName"}], "title": "Test Dataset"}
    citation = _get_cite_as(base_meta, None, "test.project-1", request)
    assert citation.startswith("Test Dataset.")


# ---------------------------------------------------------------------------
# _get_citations
# ---------------------------------------------------------------------------


def test_get_citations_filters_by_type_and_requires_title():
    base_meta = {
        "relatedPublications": [
            {"publicationType": "cited_by", "publicationTitle": "Ignored, wrong type"},
            {"publicationType": "context", "publicationTitle": None},
            {
                "publicationType": "context",
                "publicationTitle": "Kept",
                "publicationAuthor": "Author A",
                "publicationDoi": "10.1/kept",
                "publicationLink": "https://example.com/kept",
            },
            {"publicationType": "linked_dataset", "publicationTitle": "Also kept"},
        ]
    }
    citations = _get_citations(base_meta)
    assert [c["name"] for c in citations] == ["Kept", "Also kept"]


def test_get_citations_prefers_doi_identifier_and_includes_publisher():
    base_meta = {
        "relatedPublications": [
            {
                "publicationType": "context",
                "publicationTitle": "Kept",
                "publicationDoi": "10.1/kept",
                "publicationLink": "https://example.com/kept",
                "publicationPublisher": "Some Press",
            }
        ]
    }
    citation = _get_citations(base_meta)[0]
    assert citation["identifier"] == "https://doi.org/10.1/kept"
    assert citation["publisher"] == {"@type": "Organization", "name": "Some Press"}


def test_get_citations_strips_empty_fields():
    base_meta = {
        "relatedPublications": [{"publicationType": "context", "publicationTitle": "Kept", "publicationAuthor": None}]
    }
    citation = _get_citations(base_meta)[0]
    assert "author" not in citation
    assert "publisher" not in citation
    assert "identifier" not in citation


# ---------------------------------------------------------------------------
# _format_citation_author / _format_citation_date
# ---------------------------------------------------------------------------


def test_format_citation_author_last_first():
    assert _format_citation_author({"first_name": "Ada", "last_name": "Lovelace"}) == "Lovelace, Ada"


@pytest.mark.parametrize(
    "author,expected",
    [
        ({"last_name": "Lovelace"}, "Lovelace"),
        ({"first_name": "Ada"}, "Ada"),
        ({}, ""),
    ],
)
def test_format_citation_author_fallback(author, expected):
    assert _format_citation_author(author) == expected


@pytest.mark.parametrize(
    "date_value,expected",
    [
        (None, None),
        ("", None),
        ("2024-05-01", "2024/05/01"),
        ("2024-05-01T12:00:00Z", "2024/05/01"),
        ("2024-05", "2024/05"),
        ("2024", "2024"),
        ("not-a-date", "not-a-date"),
    ],
)
def test_format_citation_date(date_value, expected):
    assert _format_citation_date(date_value) == expected


# ---------------------------------------------------------------------------
# _get_citation_pdf_url
# ---------------------------------------------------------------------------


def test_get_citation_pdf_url_finds_first_pdf(rf):
    request = make_request(rf)
    base_meta = {
        "fileObjs": [
            {"type": "file", "name": "readme.txt", "path": "/readme.txt"},
            {"type": "file", "name": "paper.pdf", "path": "/paper.pdf"},
            {"type": "file", "name": "other.pdf", "path": "/other.pdf"},
        ]
    }
    url = _get_citation_pdf_url(base_meta, "test.project-1", request)
    assert url == _get_publication_file_url("test.project-1", "paper.pdf", request)


def test_get_citation_pdf_url_none_when_no_pdf(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "readme.txt", "path": "/readme.txt"}]}
    assert _get_citation_pdf_url(base_meta, "test.project-1", request) is None


def test_get_citation_pdf_url_skips_incomplete_entries(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "", "path": "/x.pdf"}, {"type": "dir", "name": "x.pdf"}]}
    assert _get_citation_pdf_url(base_meta, "test.project-1", request) is None


# ---------------------------------------------------------------------------
# dumps_json_ld
# ---------------------------------------------------------------------------


def test_dumps_json_ld_escapes_html_sensitive_chars():
    payload = {"name": "<script>&alert('x')</script>"}
    body = dumps_json_ld(payload)
    assert "<" not in body
    assert ">" not in body
    assert "&" not in body
    assert "\\u003c" in body
    assert "\\u003e" in body
    assert "\\u0026" in body
    # Round-trips back to the original (unescaping is just JS/JSON string decoding, not tested
    # here, but confirm it's still valid JSON).
    assert json.loads(body.encode().decode("unicode_escape")) == payload


# ---------------------------------------------------------------------------
# PublicationFileDownloadView
# ---------------------------------------------------------------------------


def test_publication_file_download_view_delegates_to_tapis_files_view(rf, settings):
    request = make_request(rf)
    mock_response = MagicMock()
    mock_dispatch = MagicMock(return_value=mock_response)
    with patch("portal.apps.public_data.views.TapisFilesView.as_view", return_value=mock_dispatch) as mock_as_view:
        response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="a/b.csv")

    mock_as_view.assert_called_once()
    mock_dispatch.assert_called_once_with(
        request,
        operation="download",
        scheme="projects",
        system="test.project.published.test.project-1",
        path="a/b.csv",
    )
    assert response is mock_response


# ---------------------------------------------------------------------------
# get_schema_org_json
# ---------------------------------------------------------------------------


def test_get_schema_org_json_success(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    schema = get_schema_org_json(publication, publication.project_id, request)

    assert schema["@type"] == "Dataset"
    assert schema["name"] == "Test Dataset"
    assert schema["description"] == "A dataset for testing"
    assert schema["license"] == LICENSE_URLS["ODC-BY 1.0"]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.0"
    assert schema["isAccessibleForFree"] is True
    assert schema["identifier"] == "https://doi.org/10.1234/test-doi"
    assert schema["sameAs"] == "https://doi.org/10.1234/test-doi"
    assert len(schema["creator"]) == 1
    assert schema["creator"][0]["name"] == "Ada Lovelace"
    assert schema["creator"][0]["affiliation"] == {"@type": "Organization", "name": "Test University"}
    assert schema["creator"][0]["sameAs"] == "https://orcid.org/0000-0002-1825-0097"
    assert schema["publisher"] == {"@type": "Organization", "name": "Test Publisher"}
    assert schema["version"] == 3
    assert schema["dateModified"] == publication.last_updated.isoformat()
    assert len(schema["distribution"]) == 1
    assert len(schema["recordSet"]) == 1
    assert len(schema["citation"]) == 1


def test_get_schema_org_json_no_files_omits_conforms_to_and_distribution(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    publication.value = valid_base_meta(fileObjs=[{"type": "folder", "name": "dir", "path": "/dir"}])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)
    assert "conformsTo" not in schema
    assert "distribution" not in schema


def test_get_schema_org_json_missing_non_croissant_field_raises(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(title=None)
    publication.save()

    with pytest.raises(SchemaOrgValidationError, match="incomplete"):
        get_schema_org_json(publication, publication.project_id, request)


def test_get_schema_org_json_missing_croissant_field_raises_with_croissant_reason(rf, publication):
    request = make_request(rf)
    # Files present (has_files True) but none carry a usable name/path, so `distribution` ends up
    # empty and is dropped -- and, unlike the no-files case, it's still required here.
    publication.value = valid_base_meta(fileObjs=[{"type": "file", "name": "", "path": ""}])
    publication.save()

    with pytest.raises(SchemaOrgValidationError, match="conformsTo") as excinfo:
        get_schema_org_json(publication, publication.project_id, request)
    assert "distribution" in str(excinfo.value)


def test_get_schema_org_json_creator_without_institution_or_orcid(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(
        institution="",
        authors=[{"first_name": "No", "last_name": "Orcid"}],
    )
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)
    creator = schema["creator"][0]
    assert creator == {"@type": "Person", "name": "No Orcid"}
    assert "affiliation" not in creator
    assert "sameAs" not in creator


def test_get_schema_org_json_drops_empty_optional_fields(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(keywords="", relatedPublications=[])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)
    assert "keywords" not in schema
    assert "citation" not in schema


# ---------------------------------------------------------------------------
# get_citation_context
# ---------------------------------------------------------------------------


def test_get_citation_context(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    citation_meta, schema_org_json, pub_title = get_citation_context(publication, request)

    assert pub_title == "Test Dataset"
    assert citation_meta["keywords"] == "alpha, beta"
    entity = citation_meta["entities"][0]
    assert entity["title"] == "Test Dataset"
    assert entity["doi"] == "10.1234/test-doi"
    assert entity["identifier"] == schema_org_json["identifier"]
    assert entity["license"] == schema_org_json["license"]
    assert entity["dc_creators"] == ["Ada Lovelace"]
    assert entity["citation_authors"] == ["Lovelace, Ada"]
    assert entity["citation_date"] == "2024/05/01"
    assert entity["abstract_url"] == schema_org_json["url"]
    assert citation_meta["cover_image_url"] is None  # PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME unset


def test_get_citation_context_keywords_list_is_joined(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    publication.value = valid_base_meta(keywords=["alpha", "beta", "gamma"])
    publication.save()

    citation_meta, _, _ = get_citation_context(publication, request)
    assert citation_meta["keywords"] == "alpha, beta, gamma"


def test_get_citation_context_cover_image_url_when_configured(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    request = make_request(rf)

    citation_meta, _, _ = get_citation_context(publication, request)
    assert (
        citation_meta["cover_image_url"]
        == "http://testserver/api/datafiles/tapis/download/projects/root.system/cover.png/"
    )


# ---------------------------------------------------------------------------
# IndexView (via the Django test client)
# ---------------------------------------------------------------------------
#
# index.html's `{% else %}` branch does `{% include "index.html" %}` -- the built frontend
# bundle, only resolvable via the `client/dist` TEMPLATES dir that settings.py's (production)
# TEMPLATES config includes but unit_test_settings.py's does not. So every one of these tests
# forces the `{% if DEBUG %}` branch instead (which every production/dev deployment actually
# uses whenever DEBUG=True) by overriding settings.DEBUG -- this is a pre-existing gap in
# unit_test_settings.py, not something specific to these tests: the same TemplateDoesNotExist
# already reproduces on the *existing* portal/apps/site_search/views_unit_test.py tests today.


def test_index_view_renders_publication(client, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.DEBUG = True
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    response = client.get(url)

    assert response.status_code == 200
    assert response.context["setup_complete"] is False
    assert response.context["publisher"] == "Test Publisher"
    assert "schema_org_json" in response.context
    assert response.context["canonical_url"] == "http://testserver" + url


def test_index_view_missing_publication_404s(client):
    url = reverse("publications:index", kwargs={"project_id": "test.project-999"})
    response = client.get(url)
    assert response.status_code == 404


@patch("portal.apps.public_data.views.logger")
def test_index_view_revision_mismatch_logs_warning(mock_logger, client, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.DEBUG = True
    response = client.get(f"/published-datasets/test.project.published.{publication.project_id}v99/")

    assert response.status_code == 200
    mock_logger.warning.assert_called_once()
    assert str(publication.project_id) in mock_logger.warning.call_args[0][0]


@patch("portal.apps.public_data.views.logger")
def test_index_view_schema_org_validation_error_is_caught_and_logged(mock_logger, client, settings, publication):
    settings.DEBUG = True
    publication.value = valid_base_meta(title=None)
    publication.save()

    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    response = client.get(url)

    assert response.status_code == 200
    assert response.context["setup_complete"] is False
    assert "schema_org_json" not in response.context
    mock_logger.exception.assert_called_once()


def test_index_view_fallback_route_has_no_publication_context(client, settings):
    settings.DEBUG = True
    response = client.get("/published-datasets/not-a-real-project/")
    assert response.status_code == 200
    assert response.context["setup_complete"] is False
    assert "schema_org_json" not in response.context
    assert "citation_context" not in response.context


# ---------------------------------------------------------------------------
# DataciteJsonPreviewView
# ---------------------------------------------------------------------------


def test_datacite_preview_view_renders_valid_publication(client, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    url = reverse("publications:datacite_preview", kwargs={"project_id": publication.project_id})
    response = client.get(url)

    assert response.status_code == 200
    assert response["Content-Type"] == "text/plain"
    assert "schema.org/Dataset JSON-LD" in response.content.decode()
    assert '"name": "Test Dataset"' in response.content.decode()


def test_datacite_preview_view_shows_invalid_marker_for_incomplete_publication(client, publication):
    publication.value = valid_base_meta(title=None)
    publication.save()

    url = reverse("publications:datacite_preview", kwargs={"project_id": publication.project_id})
    response = client.get(url)

    assert response.status_code == 200
    assert "INVALID:" in response.content.decode()


def test_datacite_preview_view_missing_publication_404s(client):
    url = reverse("publications:datacite_preview", kwargs={"project_id": "test.project-999"})
    response = client.get(url)
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# SitemapView
# ---------------------------------------------------------------------------


def test_sitemap_view_lists_published_publications_in_order(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(project_id="test.project-2", value=valid_base_meta(), tree={}, is_published=True)
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True)
    Publication.objects.create(project_id="test.project-3", value=valid_base_meta(), tree={}, is_published=False)

    response = client.get(reverse("sitemap"))
    body = response.content.decode()

    assert response.status_code == 200
    assert response["Content-Type"] == "application/xml"
    assert body.count("<url>") == 2
    first_index = body.index("test.project-1")
    second_index = body.index("test.project-2")
    assert first_index < second_index
    assert "test.project-3" not in body


def test_sitemap_view_empty_when_no_publications(client):
    response = client.get(reverse("sitemap"))
    body = response.content.decode()
    assert response.status_code == 200
    assert "<url>" not in body
    assert "<urlset" in body
