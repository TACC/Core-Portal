import json
import re
from unittest.mock import patch

import networkx as nx
import pytest
from django.http import Http404
from django.test import RequestFactory
from django.urls import reverse

from portal.apps.projects.schema_models.license_urls import LICENSE_URLS
from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json
from portal.apps.public_data.views import (
    PublicationCoverImageView,
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
    _get_publication_file_objs,
    _get_publication_file_url,
    _get_record_sets,
    _is_publication_file_path,
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
    distribution = _get_distribution(base_meta["fileObjs"], "test.project-1", request)
    assert len(distribution) == 1
    file_object = distribution[0]
    assert file_object["@type"] == "cr:FileObject"
    assert file_object["@id"] == "data.csv"
    assert file_object["name"] == "data.csv"
    assert (
        file_object["contentUrl"]
        == "http://testserver/published-datasets/test.project.published.test.project-1/files/data.csv"
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
    assert _get_distribution(base_meta["fileObjs"], "test.project-1", request) == []


def test_get_distribution_percent_encodes_path_and_defaults_encoding_format(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "weird.unknownext", "path": "sub dir/data file.bin"}]}
    distribution = _get_distribution(base_meta["fileObjs"], "test.project-1", request)
    file_object = distribution[0]
    assert file_object["@id"] == "sub%20dir/data%20file.bin"
    assert file_object["contentUrl"].endswith("/files/sub%20dir/data%20file.bin")
    assert file_object["encodingFormat"] == "application/octet-stream"
    assert "contentSize" not in file_object
    assert "sha256" not in file_object


# ---------------------------------------------------------------------------
# _get_cover_image_url
# ---------------------------------------------------------------------------


def test_get_cover_image_url_none_without_cover_image(rf, settings):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    request = make_request(rf)
    assert _get_cover_image_url({}, "test.project-1", request) is None


def test_get_cover_image_url_none_without_root_system(rf, settings):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = None
    request = make_request(rf)
    assert _get_cover_image_url({"coverImage": "/cover.png"}, "test.project-1", request) is None


def test_get_cover_image_url_builds_url(rf, settings):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    request = make_request(rf)
    url = _get_cover_image_url({"coverImage": "/cover.png"}, "test.project-1", request)
    assert url == "http://testserver/published-datasets/test.project.published.test.project-1/cover-image"


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
    assert _get_record_sets(base_meta["fileObjs"]) == []


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
    record_sets = _get_record_sets(base_meta["fileObjs"])
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
    field = _get_record_sets(base_meta["fileObjs"])[0]["field"][0]
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
    url = _get_citation_pdf_url(base_meta["fileObjs"], "test.project-1", request)
    assert url == _get_publication_file_url("test.project-1", "paper.pdf", request)


def test_get_citation_pdf_url_none_when_no_pdf(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "readme.txt", "path": "/readme.txt"}]}
    assert _get_citation_pdf_url(base_meta["fileObjs"], "test.project-1", request) is None


def test_get_citation_pdf_url_skips_incomplete_entries(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "", "path": "/x.pdf"}, {"type": "dir", "name": "x.pdf"}]}
    assert _get_citation_pdf_url(base_meta["fileObjs"], "test.project-1", request) is None


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


TAPIS_CONTENT_URL = "https://example.tapis.io/v3/files/content"


def entity_tree(*file_objs):
    """A minimal networkx node_link_data tree: the project root plus one entity node whose value
    carries `file_objs` -- the shape publish_project stores in Publication.tree."""
    return {
        "directed": True,
        "multigraph": False,
        "graph": {},
        "nodes": [
            {"id": "NODE_ROOT", "name": "drp.project", "value": {"title": "Test Dataset"}},
            {"id": "entity-1", "name": "drp.project.sample", "value": {"title": "Sample", "fileObjs": list(file_objs)}},
        ],
        "edges": [{"source": "NODE_ROOT", "target": "entity-1"}],
    }


@pytest.fixture
def v1_publication(db):
    """Version-1 publication whose declared files cover every path the file-route tests request:
    data.csv on the project root, the rest on an entity node in `tree`, plus an `a` directory."""
    return Publication.objects.create(
        project_id="test.project-1",
        value=valid_base_meta(),
        tree=entity_tree(
            {"type": "file", "name": "paper.pdf", "path": "/files/paper.pdf"},
            {"type": "file", "name": "data file.bin", "path": "/sub dir/data file.bin"},
            {"type": "file", "name": "missing.csv", "path": "/missing.csv"},
            {"type": "file", "name": "a.csv", "path": "/a.csv"},
            {"type": "dir", "name": "a", "path": "/a"},
        ),
        version=1,
    )


def test_publication_file_download_view_streams_file_bytes(rf, requests_mock, v1_publication):
    """The response body is the file itself, not the JSON-wrapped postit link the datafiles
    app's generic download route returns -- that's what crawlers following citation_pdf_url or
    Croissant's contentUrl need."""
    requests_mock.get(
        f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/files/paper.pdf",
        content=b"%PDF-1.7 bytes",
        headers={"Content-Length": "14"},
    )
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="files/paper.pdf")

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert response["Content-Disposition"] == 'inline; filename="paper.pdf"'
    assert response["Content-Length"] == "14"
    assert b"".join(response.streaming_content) == b"%PDF-1.7 bytes"
    assert requests_mock.last_request.headers["X-Tapis-Token"] == "test"


def test_publication_file_download_view_percent_encodes_tapis_path(rf, requests_mock, v1_publication):
    requests_mock.get(
        f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/sub%20dir/data%20file.bin",
        content=b"bytes",
    )
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="sub dir/data file.bin")

    assert response["Content-Type"] == "application/octet-stream"
    assert b"".join(response.streaming_content) == b"bytes"


@pytest.mark.parametrize("tapis_status", [400, 404])
def test_publication_file_download_view_404s_for_missing_file_or_directory(
    rf, requests_mock, tapis_status, v1_publication
):
    requests_mock.get(
        f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/missing.csv", status_code=tapis_status
    )
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="missing.csv")


def test_publication_file_download_view_reads_republished_versions_system(rf, requests_mock, publication):
    """A republish (version > 1) lands on its own `...v{version}` system (publish_project), so
    the file route has to read from there -- the unsuffixed system only holds version 1's files,
    which would contradict the current version's metadata on the landing page."""
    assert publication.version == 3
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1v3/data.csv", content=b"v3 bytes")
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="data.csv")

    assert b"".join(response.streaming_content) == b"v3 bytes"


def test_publication_file_download_view_404s_for_unknown_publication(rf, requests_mock):
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationFileDownloadView.as_view()(request, project_id="test.project-999", path="data.csv")
    assert not requests_mock.called


def test_publication_file_download_view_404s_for_undeclared_path_without_calling_tapis(
    rf, requests_mock, v1_publication
):
    """A file on the published system that the publication never declared (e.g. uploaded without
    metadata) isn't served, and the request never reaches Tapis."""
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="undeclared.csv")
    assert not requests_mock.called


def test_publication_file_download_view_serves_root_level_file(rf, requests_mock, v1_publication):
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/data.csv", content=b"root")
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="data.csv")

    assert b"".join(response.streaming_content) == b"root"


def test_publication_file_download_view_502s_on_tapis_error(rf, requests_mock, v1_publication):
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/a.csv", status_code=500)
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="a.csv")

    assert response.status_code == 502


def test_file_download_route_is_matched_before_index_fallback(client, requests_mock, v1_publication):
    """public_data/urls.py's `file_download` pattern is listed before the catch-all
    `index_fallback` (r"^.*$") specifically so a `/files/...` URL reaches
    PublicationFileDownloadView instead of being swallowed by the SPA-shell fallback -- exercise
    that ordering through the real URL resolver (client.get), not by calling the view directly.
    """
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/a/b.csv", content=b"a,b\n1,2\n")
    url = reverse("publications:file_download", kwargs={"project_id": "test.project-1", "path": "a/b.csv"})

    response = client.get(url)

    assert response.status_code == 200
    assert response["Content-Type"] == "text/csv"
    assert b"".join(response.streaming_content) == b"a,b\n1,2\n"


WEB_BASE_URL = "https://web.example.org/published"


def test_publication_file_download_view_redirects_to_web_mirror(rf, settings, requests_mock, v1_publication):
    """With a web mirror configured (web.corral on DRP), the file route redirects there instead of
    relaying bytes through Tapis -- the mirror serves byte ranges and multi-GB files directly, so no
    uWSGI worker is held for the download."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="files/paper.pdf")

    assert response.status_code == 302
    assert response["Location"] == f"{WEB_BASE_URL}/test.project-1/files/paper.pdf"
    assert not requests_mock.called


def test_publication_file_download_view_redirects_into_republished_versions_directory(
    rf, settings, requests_mock, publication
):
    """Each republish has its own `{project_id}v{version}` directory under the published root, the
    same suffix as its Tapis system."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = f"{WEB_BASE_URL}/"
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="data.csv")

    assert response["Location"] == f"{WEB_BASE_URL}/test.project-1v3/data.csv"
    assert not requests_mock.called


def test_publication_file_download_view_web_redirect_percent_encodes_path(rf, settings, db):
    """Spaces (as in DRP's real "Greyscale Stack .TIF/..." paths) and `#`/`?` are percent-encoded,
    so a stored path can't add a fragment/query or move the redirect off the mirror's host."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    path = "Greyscale Stack .TIF/scan #1?.tif"
    Publication.objects.create(
        project_id="test.project-1",
        value=valid_base_meta(fileObjs=[{"type": "file", "name": "scan #1?.tif", "path": f"/{path}"}]),
        tree={},
        version=1,
    )
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path=path)

    assert response["Location"] == f"{WEB_BASE_URL}/test.project-1/Greyscale%20Stack%20.TIF/scan%20%231%3F.tif"


@pytest.mark.parametrize("path", ["undeclared.csv", "a/../../other-project/secret.csv"])
def test_publication_file_download_view_404s_instead_of_redirecting_undeclared_paths(
    rf, settings, v1_publication, path
):
    """The allow-list still applies with a web mirror configured, so the route can't be used as a
    redirect to arbitrary paths on the mirror."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path=path)


def test_file_download_route_redirects_to_web_mirror_through_url_resolver(client, settings, v1_publication):
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    url = reverse("publications:file_download", kwargs={"project_id": "test.project-1", "path": "a/b.csv"})

    response = client.get(url)

    assert response.status_code == 302
    assert response["Location"] == f"{WEB_BASE_URL}/test.project-1/a/b.csv"


# ---------------------------------------------------------------------------
# _get_publication_file_objs / _is_publication_file_path
# ---------------------------------------------------------------------------


def test_schema_org_and_citation_include_entity_node_files(rf, settings, publication):
    """Files attached to entity nodes (most DRP data -- samples, digital datasets) live in
    `Publication.tree`, not `pub.value`. distribution, recordSet and citation_pdf_url must list
    them alongside root-level files, so the JSON-LD advertises exactly what the file route's
    allow-list serves."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.tree = entity_tree(
        {"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif"},
        {"type": "file", "name": "paper.pdf", "path": "/sample1/paper.pdf"},
        {"type": "file", "name": "table.csv", "path": "/sample1/table.csv", "columns": [{"name": "x"}]},
        {"type": "dir", "name": "raw", "path": "/sample1/raw"},
    )
    publication.save()
    request = make_request(rf)

    citation_meta, schema, _ = get_citation_context(publication, request)

    distribution_ids = [file_object["@id"] for file_object in schema["distribution"]]
    # Root-level data.csv first, then the entity's files; the directory isn't enumerated.
    assert distribution_ids == ["data.csv", "sample1/scan.tif", "sample1/paper.pdf", "sample1/table.csv"]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.0"
    assert {record_set["@id"] for record_set in schema["recordSet"]} == {
        "data.csv/records",
        "sample1/table.csv/records",
    }
    assert citation_meta["entities"][0]["pdf_url"] == _get_publication_file_url(
        publication.project_id, "sample1/paper.pdf", request
    )
    # Everything advertised is something the file route will actually serve.
    for file_object in schema["distribution"]:
        assert _is_publication_file_path(publication, file_object["@id"].replace("%20", " "))


def test_entity_only_files_still_make_publication_a_croissant_candidate(rf, settings, publication):
    """A publication whose files are all on entity nodes (nothing on the project root) used to
    count as fileless: no distribution and no conformsTo."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.value = valid_base_meta(fileObjs=[])
    publication.tree = entity_tree({"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif"})
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))

    assert [file_object["@id"] for file_object in schema["distribution"]] == ["sample1/scan.tif"]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.0"


def test_get_publication_file_objs_combines_root_and_entity_nodes_deduped_by_path(publication):
    publication.tree = entity_tree(
        {"type": "file", "name": "paper.pdf", "path": "/files/paper.pdf"},
        # Same file as the root's data.csv, with/without a leading slash -- listed once.
        {"type": "file", "name": "data.csv", "path": "data.csv"},
    )

    paths = sorted(file_obj["path"].strip("/") for file_obj in _get_publication_file_objs(publication))

    assert paths == ["data.csv", "files/paper.pdf"]


def test_get_publication_file_objs_tolerates_empty_tree_and_valueless_nodes(publication):
    publication.tree = {"nodes": [{"id": "NODE_ROOT"}, {"id": "x", "value": None}]}
    assert [file_obj["path"] for file_obj in _get_publication_file_objs(publication)] == ["/data.csv"]

    publication.tree = {}
    assert [file_obj["path"] for file_obj in _get_publication_file_objs(publication)] == ["/data.csv"]


@pytest.mark.parametrize(
    "path,allowed",
    [
        ("data.csv", True),  # root-level file object
        ("files/paper.pdf", True),  # entity-node file object
        ("a/b.csv", True),  # inside a directory file object
        ("a/nested/c.csv", True),
        ("a", False),  # the directory itself isn't a file
        ("undeclared.csv", False),
        ("files/other.pdf", False),
        ("a/../secret.csv", False),  # would escape the declared directory
        ("./data.csv", False),
        ("a//b.csv", False),
        ("ab/c.csv", False),  # shares a prefix with `a` but isn't inside it
    ],
)
def test_is_publication_file_path(v1_publication, path, allowed):
    v1_publication.tree = entity_tree(
        {"type": "file", "name": "paper.pdf", "path": "/files/paper.pdf"},
        {"type": "dir", "name": "a", "path": "/a"},
    )
    assert _is_publication_file_path(v1_publication, path) is allowed


# ---------------------------------------------------------------------------
# PublicationCoverImageView
# ---------------------------------------------------------------------------


def test_cover_image_route_streams_stored_cover_image(client, settings, publication, requests_mock):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    requests_mock.get(f"{TAPIS_CONTENT_URL}/root.system/cover.png", content=b"\x89PNG bytes")
    url = reverse("publications:cover_image", kwargs={"project_id": publication.project_id})

    response = client.get(url)

    assert response.status_code == 200
    assert response["Content-Type"] == "image/png"
    assert b"".join(response.streaming_content) == b"\x89PNG bytes"


def test_cover_image_route_redirects_to_web_mirror(client, settings, publication, requests_mock):
    """The cover image lives on the published root system, whose rootDir is the mirror's root."""
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    url = reverse("publications:cover_image", kwargs={"project_id": publication.project_id})

    response = client.get(url)

    assert response.status_code == 302
    assert response["Location"] == f"{WEB_BASE_URL}/cover.png"
    assert not requests_mock.called


def test_cover_image_view_404s_without_cover_image(rf, settings, publication):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    publication.value = {**publication.value, "coverImage": None}
    publication.save()
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationCoverImageView.as_view()(request, project_id=publication.project_id)


def test_cover_image_view_404s_for_unknown_publication(rf, settings, db):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationCoverImageView.as_view()(request, project_id="test.project-999")


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


@pytest.mark.parametrize("field", ["description", "title"])
def test_get_schema_org_json_missing_required_dataset_field_names_it(rf, publication, field):
    request = make_request(rf)
    publication.value = valid_base_meta(**{field: ""})
    publication.save()

    with pytest.raises(SchemaOrgValidationError, match="name" if field == "title" else "description"):
        get_schema_org_json(publication, publication.project_id, request)


@patch("portal.apps.public_data.views.logger")
def test_get_schema_org_json_files_without_usable_distribution_drops_conforms_to(mock_logger, rf, publication):
    """Files present (has_files True) but none carry a usable name, so `distribution` ends up
    empty. That's no longer fatal: the plain Dataset is still emitted, just without the Croissant
    claim, and the data bug is logged. (A file object with no path at all can't be identified or
    served, so _get_publication_file_objs drops it outright -- it doesn't count as a file.)"""
    request = make_request(rf)
    publication.value = valid_base_meta(fileObjs=[{"type": "file", "name": "", "path": "/unnamed.csv"}])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert schema["@type"] == "Dataset"
    assert schema["name"] == "Test Dataset"
    assert "conformsTo" not in schema
    assert "distribution" not in schema
    mock_logger.warning.assert_called_once()
    assert "distribution" in mock_logger.warning.call_args.args[0]


@pytest.mark.parametrize(
    "overrides,missing_field",
    [
        ({"license": None}, "license"),
        ({"authors": []}, "creator"),
        ({"publicationDate": None}, "datePublished"),
    ],
)
@patch("portal.apps.public_data.views.logger")
def test_get_schema_org_json_missing_croissant_field_still_emits_plain_dataset(
    mock_logger, rf, publication, overrides, missing_field
):
    request = make_request(rf)
    publication.value = valid_base_meta(**overrides)
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert schema["@type"] == "Dataset"
    assert schema["name"] == "Test Dataset"
    assert schema["description"] == "A dataset for testing"
    assert missing_field not in schema
    assert "conformsTo" not in schema
    # Everything not tied to the missing field is still emitted.
    assert len(schema["distribution"]) == 1
    mock_logger.warning.assert_called_once()
    assert missing_field in mock_logger.warning.call_args.args[0]


def test_get_schema_org_json_fileless_publication_missing_croissant_fields_logs_nothing(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(fileObjs=[], license=None, authors=[])
    publication.save()

    with patch("portal.apps.public_data.views.logger") as mock_logger:
        schema = get_schema_org_json(publication, publication.project_id, request)

    assert "conformsTo" not in schema
    mock_logger.warning.assert_not_called()


@patch("portal.apps.public_data.views.logger")
def test_get_schema_org_json_unmapped_license_logs_and_omits_license(mock_logger, rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(license="unmapped-license")
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert "license" not in schema
    assert "conformsTo" not in schema
    assert schema["name"] == "Test Dataset"
    mock_logger.error.assert_called_once()
    assert "unmapped-license" in mock_logger.error.call_args.args[0]


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
        == "http://testserver/published-datasets/test.project.published.test.project-1/cover-image"
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
# IndexView rendered HTML -- the actual served <head> tags, not just view context.
#
# get_schema_org_json/get_citation_context are unit-tested above in isolation, but nothing
# confirms their output actually reaches the page: a wrong template variable name, a missing
# `|safe`, or a broken block override in index.html/base.html would pass every test above while
# silently breaking the SEO tags this feature exists to serve. These render the real template
# (via the Django test client) and inspect response.content.
# ---------------------------------------------------------------------------


def test_index_view_renders_json_ld_script_tag(client, settings, publication):
    settings.DEBUG = True
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    body = client.get(url).content.decode()

    match = re.search(r'<script type="application/ld\+json">(.*?)</script>', body, re.DOTALL)
    assert match is not None
    payload = json.loads(match.group(1))
    assert payload["name"] == "Test Dataset"
    assert payload["license"] == "https://opendatacommons.org/licenses/by/1-0/"
    assert payload["@type"] == "Dataset"


def test_index_view_renders_citation_and_dc_meta_tags(client, settings, publication):
    settings.DEBUG = True
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    body = client.get(url).content.decode()

    assert '<meta name="citation_title" content="Test Dataset">' in body
    assert '<meta name="citation_author" content="Lovelace, Ada">' in body
    assert '<meta name="citation_doi" content="10.1234/test-doi">' in body
    assert '<meta name="citation_publisher" content="Test Publisher">' in body
    assert '<meta name="DC.title" content="Test Dataset">' in body
    assert '<meta name="DC.creator" content="Ada Lovelace">' in body
    assert '<meta name="DC.rights" content="https://opendatacommons.org/licenses/by/1-0/">' in body
    assert '<meta name="DC.identifier" content="https://doi.org/10.1234/test-doi">' in body


def test_index_view_renders_citation_pdf_url_when_pdf_present(client, settings):
    settings.DEBUG = True
    pub = Publication.objects.create(
        project_id="test.project-2",
        value=valid_base_meta(
            fileObjs=[{"type": "file", "name": "paper.pdf", "path": "/files/paper.pdf"}],
        ),
        tree={},
    )
    url = reverse("publications:index", kwargs={"project_id": pub.project_id})
    body = client.get(url).content.decode()

    expected_pdf_url = reverse(
        "publications:file_download", kwargs={"project_id": pub.project_id, "path": "files/paper.pdf"}
    )
    assert f'<meta name="citation_pdf_url" content="http://testserver{expected_pdf_url}">' in body


def test_index_view_renders_title_and_description_from_publication(client, settings, publication):
    settings.DEBUG = True
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    body = client.get(url).content.decode()

    title_match = re.search(r"<title>(.*?)</title>", body, re.DOTALL)
    assert title_match is not None
    assert title_match.group(1).strip() == "Test Dataset | test"
    assert "A dataset for testing" in body


def test_index_view_publication_route_is_indexable(client, settings, publication):
    settings.DEBUG = True
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    body = client.get(url).content.decode()

    assert 'content="' in body
    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert "index, follow, max-image-preview:large" in robots_match.group(1)


def test_index_view_fallback_route_is_noindex(client, settings):
    settings.DEBUG = True
    body = client.get("/published-datasets/not-a-real-project/").content.decode()

    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert robots_match.group(1).strip() == "noindex, follow"
    assert "citation_title" not in body
    assert "application/ld+json" not in body


def test_index_view_renders_og_image_when_cover_image_configured(client, settings, publication):
    settings.DEBUG = True
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    body = client.get(url).content.decode()

    expected_url = "http://testserver/published-datasets/test.project.published.test.project-1/cover-image"
    assert f'<meta property="og:image" content="{expected_url}">' in body
    assert f'<meta name="twitter:image" content="{expected_url}">' in body
    card_match = re.search(r'<meta name="twitter:card" content="([^"]*)">', body)
    assert card_match is not None
    assert card_match.group(1).strip() == "summary_large_image"


def test_index_view_omits_og_image_without_cover_image_configured(client, settings, publication):
    settings.DEBUG = True
    url = reverse("publications:index", kwargs={"project_id": publication.project_id})
    body = client.get(url).content.decode()

    assert 'property="og:image"' not in body
    assert 'name="twitter:image"' not in body
    card_match = re.search(r'<meta name="twitter:card" content="([^"]*)">', body)
    assert card_match is not None
    assert card_match.group(1).strip() == "summary"


# ---------------------------------------------------------------------------
# SitemapView
# ---------------------------------------------------------------------------


def test_sitemap_view_served_ahead_of_published_datasets_catch_all(client):
    assert reverse("sitemap") == "/published-datasets/sitemap.xml"
    response = client.get("/published-datasets/sitemap.xml")
    assert response.status_code == 200
    assert response["Content-Type"] == "application/xml"
    assert "<urlset" in response.content.decode()


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


@patch("portal.apps.public_data.views.logger")
def test_sitemap_view_omits_and_logs_publications_whose_metadata_fails(mock_logger, client, settings):
    """A publication IndexView would render noindex (its JSON-LD fails to build) mustn't be
    submitted to crawlers via the sitemap, and the omission must be logged so it gets fixed."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True)
    Publication.objects.create(
        project_id="test.project-2",
        value=valid_base_meta(description=""),
        tree={},
        is_published=True,
    )

    body = client.get(reverse("sitemap")).content.decode()

    assert body.count("<url>") == 1
    assert "test.project-1" in body
    assert "test.project-2" not in body
    mock_logger.exception.assert_called_once()
    assert "test.project-2" in mock_logger.exception.call_args.args[0]


def test_sitemap_omitted_publication_is_noindex_on_its_landing_page(client, settings):
    """The sitemap's omission rule and IndexView's noindex fallback have to agree -- confirm the
    same broken publication really does render noindex, so the sitemap isn't dropping a page
    that's actually indexable."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.DEBUG = True
    pub = Publication.objects.create(
        project_id="test.project-2",
        value=valid_base_meta(description=""),
        tree={},
        is_published=True,
    )

    body = client.get(reverse("publications:index", kwargs={"project_id": pub.project_id})).content.decode()

    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert robots_match.group(1).strip() == "noindex, follow"
    assert "test.project-2" not in client.get(reverse("sitemap")).content.decode()


def test_publication_without_license_is_indexable_and_in_sitemap(client, settings):
    """A missing license used to fail the whole page closed (noindex, no JSON-LD, out of the
    sitemap). It's optional on the publish form, so it now only withholds the Croissant claim."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.DEBUG = True
    pub = Publication.objects.create(
        project_id="test.project-2",
        value=valid_base_meta(license=None),
        tree={},
        is_published=True,
    )

    body = client.get(reverse("publications:index", kwargs={"project_id": pub.project_id})).content.decode()

    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert robots_match.group(1).strip() == "index, follow, max-image-preview:large"
    json_ld = re.search(r'<script type="application/ld\+json">(.*?)</script>', body, re.S)
    assert json_ld is not None
    schema = json.loads(json_ld.group(1))
    assert schema["@type"] == "Dataset"
    assert "conformsTo" not in schema
    assert "license" not in schema
    assert "test.project-2" in client.get(reverse("sitemap")).content.decode()


def test_sitemap_view_empty_when_no_publications(client):
    response = client.get(reverse("sitemap"))
    body = response.content.decode()
    assert response.status_code == 200
    assert "<url>" not in body
    assert "<urlset" in body


def test_datacite_url_matches_landing_page_url_and_sitemap(client, settings):
    """The DOI must resolve to the exact URL the landing page claims (canonical/JSON-LD `url`) and
    the sitemap lists -- even when VANITY_BASE_URL falls back to a different, internal host, as it
    does on DRP prod (_WH_BASE_URL)."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.VANITY_BASE_URL = "https://prod.internal.example.org"
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://vanity.example.org/published-datasets"
    base_meta = valid_base_meta()
    pub = Publication.objects.create(project_id="test.project-1", value=base_meta, tree={}, is_published=True)
    pub_graph = nx.DiGraph()
    pub_graph.add_node("NODE_ROOT", value={**base_meta, "projectId": "test.project.published.test.project-1"})

    datacite_url = get_datacite_json(pub_graph, pub.project_id)["url"]
    landing_page_url = _get_landing_page_url(pub.project_id, make_request(RequestFactory()))
    sitemap_locs = re.findall(r"<loc>(.*?)</loc>", client.get(reverse("sitemap")).content.decode())

    assert datacite_url.startswith("https://vanity.example.org/")
    assert datacite_url == landing_page_url
    assert sitemap_locs == [datacite_url]
