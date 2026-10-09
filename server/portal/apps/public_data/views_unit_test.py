import json
import posixpath
import re
from html.parser import HTMLParser
from pathlib import Path
from unittest.mock import patch
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

import networkx as nx
import pytest
import requests
from django.core.cache import cache
from django.http import Http404
from django.test import RequestFactory
from django.urls import NoReverseMatch, resolve, reverse
from django.utils.html import escape

from portal.apps.projects.schema_models.license_urls import LICENSE_URLS
from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json
from portal.apps.public_data.citations import (
    _format_citation_author,
    _format_citation_date,
    _get_apa_citation,
    _get_bibtex_citation,
    _get_citation_pdf_url,
    _get_citations,
)
from portal.apps.public_data.links import (
    _get_configured_origin,
    _get_cover_image_url,
    _get_landing_page_url,
    _get_publication_file_url,
)
from portal.apps.public_data.schema_org import (
    SchemaOrgValidationError,
    _format_content_size,
    _get_archive_file_object,
    _get_distribution,
    _get_license,
    _get_orcid_same_as,
    _get_publication_file_objs,
    _get_record_sets,
    _has_type,
    dumps_json_ld,
    get_citation_context,
    get_schema_org_json,
)
from portal.apps.public_data.views import (
    PublicationArchiveView,
    PublicationCoverImageView,
    PublicationCroissantView,
    PublicationFileDownloadView,
    _is_publication_file_path,
)
from portal.apps.publications.models import Publication
from portal.apps.publications.utils import get_landing_page_path

pytestmark = pytest.mark.django_db


# SitemapView caches its body, so a sitemap built by one test mustn't be served to the next.
@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def rf():
    return RequestFactory()


def make_request(rf, path="/"):
    return rf.get(path)


# Where test.project-1's published files are served from (public_data/urls.py's `file_download`), which
# is also each file's Croissant `@id`.
FILES_URL = "http://testserver/published-datasets/test.project.published.test.project-1/files/"


def full_author(orcid="0000-0002-1825-0097"):
    return {"first_name": "Ada", "last_name": "Lovelace", "email": "ada@example.com", "orcid_id": orcid}


# Within Google Dataset Search's 50-5000 character `description` range, so the length warning
# (GOOGLE_DATASET_DESCRIPTION_LENGTH) only fires in the tests that ask for it.
TEST_DESCRIPTION = "A dataset for testing the published-dataset landing page metadata."


def valid_base_meta(**overrides):
    meta = {
        "title": "Test Dataset",
        "description": TEST_DESCRIPTION,
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


@pytest.mark.parametrize(
    "orcid", ["https://orcid.org/0000-0002-1825-0097", "http://www.orcid.org/0000-0002-1825-0097/"]
)
def test_get_orcid_same_as_normalizes_url(orcid):
    assert _get_orcid_same_as({"orcid_id": orcid}) == "https://orcid.org/0000-0002-1825-0097"


def test_get_orcid_same_as_rejects_non_orcid_url():
    assert _get_orcid_same_as({"orcid_id": "https://example.com/0000-0002-1825-0097"}) is None


@pytest.mark.parametrize("orcid", ["0000-0002-1825-0097", "0000-0002-9079-593X"])
def test_get_orcid_same_as_valid_raw_id(orcid):
    assert _get_orcid_same_as({"orcid_id": orcid}) == f"https://orcid.org/{orcid}"


@pytest.mark.parametrize("orcid", ["not-an-orcid", "1234-5678-9012", "0000-0002-1825-00977"])
def test_get_orcid_same_as_invalid_format(orcid):
    assert _get_orcid_same_as({"orcid_id": orcid}) is None


@pytest.mark.parametrize("author", [{}, {"orcid_id": ""}, {"orcid_id": "  "}])
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
        (999, "999 B"),
        (1000, "1.0 KB"),
        (2048, "2.0 KB"),
        (1024 * 1024, "1.0 MB"),
        (1500 * 1000, "1.5 MB"),
        (1000**3, "1.0 GB"),
        (1000**4, "1.0 TB"),
        (1000**5, "1000.0 TB"),
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
    assert file_object["@type"] == ["cr:FileObject", "DataDownload"]
    assert file_object["@id"] == f"{FILES_URL}data.csv"
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
            {"type": "folder", "name": "folder", "path": "/folder"},
            {"type": "file", "name": "", "path": "/no-name.csv"},
            {"type": "file", "name": "no-path.csv", "path": ""},
            {"type": "dir", "name": "", "path": "/no-name-dir"},
            {"type": "dir", "name": "no-path-dir", "path": "/"},
        ]
    }
    assert _get_distribution(base_meta["fileObjs"], "test.project-1", request) == []


def test_get_distribution_omits_directories_without_archive(rf):
    """Without a ZIP, a directory has no `contentUrl` for Google and no glob Croissant can expand."""
    request = make_request(rf)
    file_objs = [{"type": "dir", "name": "raw scans", "path": "/sample1/raw scans/"}]
    assert _get_distribution(file_objs, "test.project-1", request) == []


def test_get_distribution_builds_file_sets_inside_archive(rf):
    request = make_request(rf)
    file_objs = [{"type": "dir", "name": "raw scans", "path": "/sample1/raw scans/"}]
    archive = {"@type": ["cr:FileObject", "DataDownload"], "@id": ARCHIVE_URL, "contentUrl": ARCHIVE_URL}
    distribution = _get_distribution(file_objs, "test.project-1", request, archive, "test.project-1v3")
    assert distribution == [
        {
            "@type": ["cr:FileSet", "DataDownload"],
            "@id": f"{FILES_URL}sample1/raw%20scans/",
            "name": "raw scans",
            "contentUrl": ARCHIVE_URL,
            "encodingFormat": "application/octet-stream",
            "containedIn": {"@id": ARCHIVE_URL},
            "includes": "test.project-1v3/sample1/raw scans/**",
        },
        archive,
    ]


def test_get_distribution_percent_encodes_path_and_defaults_encoding_format(rf):
    request = make_request(rf)
    base_meta = {"fileObjs": [{"type": "file", "name": "weird.unknownext", "path": "sub dir/data file.bin"}]}
    distribution = _get_distribution(base_meta["fileObjs"], "test.project-1", request)
    file_object = distribution[0]
    assert file_object["@id"] == f"{FILES_URL}sub%20dir/data%20file.bin"
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


def test_get_record_sets_skips_missing_columns_or_path(rf):
    base_meta = {
        "fileObjs": [
            {"path": "/no-columns.csv"},
            {"columns": [{"name": "a"}], "path": ""},
        ]
    }
    assert _get_record_sets(base_meta["fileObjs"], "test.project-1", make_request(rf)) == []


def test_get_record_sets_builds_fields_and_skips_unnamed_columns(rf):
    base_meta = {
        "fileObjs": [
            {
                "name": "data.csv",
                "path": "/data.csv",
                "columns": [{"name": "col1", "dataType": "sc:Integer"}, {"name": ""}, {}],
            }
        ]
    }
    record_sets = _get_record_sets(base_meta["fileObjs"], "test.project-1", make_request(rf))
    assert len(record_sets) == 1
    record_set = record_sets[0]
    assert record_set["@type"] == "cr:RecordSet"
    assert record_set["@id"] == f"{FILES_URL}data.csv#records"
    assert record_set["name"] == "data.csv"
    assert len(record_set["field"]) == 1
    field = record_set["field"][0]
    assert field["@id"] == f"{FILES_URL}data.csv#records/col1"
    assert field["name"] == "col1"
    assert field["dataType"] == "sc:Integer"
    assert field["source"] == {"fileObject": {"@id": f"{FILES_URL}data.csv"}, "extract": {"column": "col1"}}


def test_get_record_sets_default_data_type(rf):
    base_meta = {"fileObjs": [{"name": "data.csv", "path": "/data.csv", "columns": [{"name": "col1"}]}]}
    field = _get_record_sets(base_meta["fileObjs"], "test.project-1", make_request(rf))[0]["field"][0]
    assert field["dataType"] == "sc:Text"


def test_get_record_sets_ids_are_unique_for_a_column_named_records(rf):
    """A column named "records" must not share its recordSet's @id (Croissant requires unique @ids)."""
    file_objs = [{"name": "data.csv", "path": "/data.csv", "columns": [{"name": "records"}, {"name": "x"}]}]

    record_set = _get_record_sets(file_objs, "test.project-1", make_request(rf))[0]
    ids = [record_set["@id"]] + [field["@id"] for field in record_set["field"]] + [f"{FILES_URL}data.csv"]

    assert len(ids) == len(set(ids))


def test_get_record_sets_encodes_special_characters_in_ids(rf):
    file_objs = [{"name": "a#b c.csv", "path": "/dir/a#b c.csv", "columns": [{"name": "x/y#z"}]}]

    record_set = _get_record_sets(file_objs, "test.project-1", make_request(rf))[0]

    assert record_set["@id"] == f"{FILES_URL}dir/a%23b%20c.csv#records"
    field = record_set["field"][0]
    assert field["@id"] == f"{FILES_URL}dir/a%23b%20c.csv#records/x%2Fy%23z"
    # Names stay raw: `extract.column` must match the file's actual header.
    assert field["name"] == "x/y#z"
    assert field["source"] == {"fileObject": {"@id": f"{FILES_URL}dir/a%23b%20c.csv"}, "extract": {"column": "x/y#z"}}


def test_get_record_sets_includes_tsv(rf):
    file_objs = [{"name": "data.tsv", "path": "/data.tsv", "columns": [{"name": "x"}]}]

    assert [record_set["@id"] for record_set in _get_record_sets(file_objs, "test.project-1", make_request(rf))] == [
        f"{FILES_URL}data.tsv#records"
    ]


@pytest.mark.parametrize("name", ["data.xlsx", "data.parquet", "data.json", "data"])
def test_get_record_sets_skips_formats_without_column_extraction(rf, name):
    """Croissant only defines `extract.column` for CSV/TSV."""
    file_objs = [{"name": name, "path": f"/{name}", "columns": [{"name": "x"}]}]

    assert _get_record_sets(file_objs, "test.project-1", make_request(rf)) == []


@patch("portal.apps.public_data.schema_org.logger")
def test_get_record_sets_skips_and_warns_on_duplicate_column_names(mock_logger, rf):
    file_objs = [
        {"name": "dupes.csv", "path": "/dupes.csv", "columns": [{"name": "x"}, {"name": "y"}, {"name": "x"}]},
        {"name": "ok.csv", "path": "/ok.csv", "columns": [{"name": "x"}]},
    ]

    record_sets = _get_record_sets(file_objs, "test.project-1", make_request(rf))

    assert [record_set["@id"] for record_set in record_sets] == [f"{FILES_URL}ok.csv#records"]
    mock_logger.warning.assert_called_once()
    assert "test.project-1" in mock_logger.warning.call_args.args[0]
    assert "dupes.csv" in mock_logger.warning.call_args.args[0]


def test_get_record_sets_skips_file_without_url(rf):
    """A file whose URL can't be built has no `distribution` entry to reference, so no recordSet."""
    file_objs = [{"name": "data.csv", "path": "/data.csv", "columns": [{"name": "x"}]}]

    with patch("portal.apps.public_data.links.reverse", side_effect=NoReverseMatch("simulated")):
        assert _get_record_sets(file_objs, "test.project-1", make_request(rf)) == []


def test_file_ids_differ_between_publications_with_the_same_file_name(rf, settings):
    """Relative @ids resolved against the page's <base href="/">, so data.csv in two publications was
    one node; absolute file URLs keep them apart."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    ids = []
    for project_id in ("test.project-1", "test.project-2"):
        pub = Publication.objects.create(project_id=project_id, value=valid_base_meta(), tree={})
        schema = get_schema_org_json(pub, project_id, request)
        assert schema["distribution"][0]["@id"] == schema["distribution"][0]["contentUrl"]
        assert schema["recordSet"][0]["field"][0]["source"]["fileObject"]["@id"] == schema["distribution"][0]["@id"]
        ids.append(schema["distribution"][0]["@id"])

    assert ids[0] != ids[1]


# ---------------------------------------------------------------------------
# _get_landing_page_url / _get_publication_file_url
# ---------------------------------------------------------------------------


def test_get_landing_page_url(rf):
    request = make_request(rf)
    url = _get_landing_page_url("test.project-1", 1, request)
    assert url == "http://testserver" + reverse("publications:index", kwargs={"project_id": "test.project-1"})


@pytest.mark.parametrize(
    "prefix,mount",
    [("https://cep.test/published-datasets", "published-datasets"), ("https://cep.test/data", "public-data")],
)
def test_get_landing_page_url_respects_configured_origin(rf, settings, prefix, mount):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = prefix
    request = make_request(rf)
    url = _get_landing_page_url("test.project-1", 1, request)
    assert url == f"https://cep.test/{mount}/test.project.published.test.project-1"


def test_get_publication_file_url(rf):
    request = make_request(rf)
    url = _get_publication_file_url("test.project-1", "sub dir/data file.pdf", request)
    expected_path = reverse(
        "publications:file_download", kwargs={"project_id": "test.project-1", "path": "sub dir/data file.pdf"}
    )
    assert url == "http://testserver" + expected_path


# ---------------------------------------------------------------------------
# _get_apa_citation
# ---------------------------------------------------------------------------


def test_get_apa_citation_full_citation(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": [full_author()], "publicationDate": "2024-05-01", "title": "Test Dataset"}
    citation = _get_apa_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, request)
    assert citation == "Lovelace, A. (2024). Test Dataset. Test Publisher. https://doi.org/10.1234/test-doi"


def test_get_apa_citation_falls_back_to_landing_page_without_doi(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": [], "title": "Test Dataset"}
    citation = _get_apa_citation(base_meta, None, "test.project-1", 1, request)
    landing_page = _get_landing_page_url("test.project-1", 1, request)
    assert citation == f"Test Dataset. Test Publisher. {landing_page}"


def test_get_apa_citation_omits_missing_parts(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = None
    request = make_request(rf)
    base_meta = {}
    citation = _get_apa_citation(base_meta, None, "test.project-1", 1, request)
    landing_page = _get_landing_page_url("test.project-1", 1, request)
    assert citation == landing_page


def test_get_apa_citation_skips_authors_without_last_name(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": [{"first_name": "NoLastName"}], "title": "Test Dataset"}
    citation = _get_apa_citation(base_meta, None, "test.project-1", 1, request)
    assert citation.startswith("Test Dataset.")


@pytest.mark.parametrize(
    "authors,expected_creators",
    [
        (
            [{"first_name": "Ada", "last_name": "Lovelace"}, {"first_name": "Alan", "last_name": "Turing"}],
            "Lovelace, A., & Turing, A.",
        ),
        (
            [
                {"first_name": "Ada", "last_name": "Lovelace"},
                {"first_name": "Alan", "last_name": "Turing"},
                {"first_name": "Grace", "last_name": "Hopper"},
            ],
            "Lovelace, A., Turing, A., & Hopper, G.",
        ),
        ([{"first_name": "Mary Ann", "last_name": "Evans"}], "Evans, M. A."),
        ([{"first_name": "Jean-Paul", "last_name": "Sartre"}], "Sartre, J.-P."),
        ([{"first_name": None, "last_name": "Lovelace"}], "Lovelace"),
        ([{"first_name": "Ada -", "last_name": " Lovelace "}], "Lovelace, A."),
    ],
)
def test_get_apa_citation_formats_authors_apa_style(rf, settings, authors, expected_creators):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    base_meta = {"authors": authors, "publicationDate": "2024-05-01", "title": "Test Dataset"}
    citation = _get_apa_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, request)
    assert citation == f"{expected_creators} (2024). Test Dataset. Test Publisher. https://doi.org/10.1234/test-doi"


def test_get_apa_citation_never_doubles_a_period(rf, settings):
    """A creator list ending in an initial, or a title/publisher ending in punctuation, keeps its
    own mark instead of gaining a second one."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher Inc."
    request = make_request(rf)
    base_meta = {"authors": [full_author()], "title": "Is this a dataset?"}
    citation = _get_apa_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, request)
    assert citation == "Lovelace, A. Is this a dataset? Test Publisher Inc. https://doi.org/10.1234/test-doi"
    assert ".." not in citation


def test_get_apa_citation_year_without_authors(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = None
    request = make_request(rf)
    base_meta = {"publicationDate": "2024-05-01", "title": "Test Dataset"}
    citation = _get_apa_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, request)
    assert citation == "(2024). Test Dataset. https://doi.org/10.1234/test-doi"


# ---------------------------------------------------------------------------
# _get_bibtex_citation
# ---------------------------------------------------------------------------


def test_get_bibtex_citation_full_entry(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    base_meta = {"authors": [full_author()], "publicationDate": "2024-05-01", "title": "Test Dataset"}

    citation = _get_bibtex_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, make_request(rf))

    assert citation == (
        "@misc{lovelace2024,\n"
        "  author = {Lovelace, Ada},\n"
        "  title = {Test Dataset},\n"
        "  publisher = {Test Publisher},\n"
        "  year = {2024},\n"
        "  doi = {10.1234/test-doi},\n"
        "  url = {https://doi.org/10.1234/test-doi}\n"
        "}"
    )


def test_get_bibtex_citation_without_doi_links_landing_page_and_omits_missing_parts(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = None
    request = make_request(rf)

    citation = _get_bibtex_citation({"title": "Test Dataset"}, None, "test.project-1", 2, request)

    landing_page = _get_landing_page_url("test.project-1", 2, request)
    assert citation == f"@misc{{testproject1,\n  title = {{Test Dataset}},\n  url = {{{landing_page}}}\n}}"


def test_get_bibtex_citation_joins_authors_with_and_skipping_those_without_last_name(rf, settings):
    base_meta = {
        "authors": [
            {"first_name": "Ada", "last_name": "Lovelace"},
            {"first_name": "NoLastName"},
            {"first_name": None, "last_name": "Turing"},
        ],
        "title": "Test Dataset",
    }

    citation = _get_bibtex_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, make_request(rf))

    assert "  author = {Lovelace, Ada and Turing},\n" in citation
    assert citation.startswith("@misc{lovelace,\n")


def test_get_bibtex_citation_escapes_tex_special_characters(rf, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "R&D {Lab}"
    base_meta = {"title": "50% of #1 pores_x at $5 ~ a^b \\ c\nnext line", "authors": []}

    citation = _get_bibtex_citation(base_meta, "10.1234/test-doi", "test.project-1", 1, make_request(rf))

    assert (
        r"  title = {50\% of \#1 pores\_x at \$5 \textasciitilde{} a\textasciicircum{}b \textbackslash{} c next line},"
        in citation
    )
    assert r"  publisher = {R\&D \{Lab\}}," in citation


def test_get_bibtex_citation_keeps_doi_verbatim_but_drops_braces(rf, settings):
    citation = _get_bibtex_citation({"title": "T"}, "10.1234/a_b{c}", "test.project-1", 1, make_request(rf))

    assert "  doi = {10.1234/a_bc},\n" in citation


@pytest.mark.parametrize(
    "last_name,date,expected_key",
    [
        ("Gödel", "2024-05-01", "godel2024"),
        ("O'Brien-Smith", "", "obriensmith"),
        ("李", "2024-05-01", "testproject1"),
    ],
)
def test_get_bibtex_citation_key(rf, last_name, date, expected_key):
    base_meta = {"authors": [{"first_name": "A", "last_name": last_name}], "publicationDate": date, "title": "T"}

    citation = _get_bibtex_citation(base_meta, None, "test.project-1", 1, make_request(rf))

    assert citation.startswith(f"@misc{{{expected_key},\n")


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


def test_get_citations_emits_author_as_person():
    """Google's Dataset guidelines want `author` as a Person/Organization object, not a bare string."""
    base_meta = {
        "relatedPublications": [
            {"publicationType": "context", "publicationTitle": "Kept", "publicationAuthor": "Author A"}
        ]
    }
    assert _get_citations(base_meta)[0]["author"] == {"@type": "Person", "name": "Author A"}


@pytest.mark.parametrize("author", [None, ""])
def test_get_citations_omits_missing_author(author):
    base_meta = {
        "relatedPublications": [{"publicationType": "context", "publicationTitle": "Kept", "publicationAuthor": author}]
    }
    assert "author" not in _get_citations(base_meta)[0]


def test_get_citations_strips_empty_fields():
    base_meta = {
        "relatedPublications": [{"publicationType": "context", "publicationTitle": "Kept", "publicationAuthor": None}]
    }
    citation = _get_citations(base_meta)[0]
    assert "author" not in citation
    assert "publisher" not in citation
    assert "identifier" not in citation


@pytest.mark.parametrize(
    "entered_doi,expected",
    [
        ("https://doi.org/10.1/kept", "https://doi.org/10.1/kept"),
        ("doi:10.1/kept", "https://doi.org/10.1/kept"),
        ("http://dx.doi.org/10.1/kept", "https://doi.org/10.1/kept"),
        ("not a doi", None),
    ],
)
def test_get_citations_normalizes_related_doi(entered_doi, expected):
    """The form takes the DOI as free text; a URL form used to become https://doi.org/https://doi.org/..."""
    base_meta = {
        "relatedPublications": [
            {"publicationType": "context", "publicationTitle": "Kept", "publicationDoi": entered_doi}
        ]
    }
    assert _get_citations(base_meta)[0].get("identifier") == expected


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


def test_get_citation_pdf_url_finds_only_pdf(rf):
    request = make_request(rf)
    base_meta = {
        "fileObjs": [
            {"type": "file", "name": "readme.txt", "path": "/readme.txt"},
            {"type": "file", "name": "paper.pdf", "path": "/entity/paper.pdf"},
        ]
    }
    url = _get_citation_pdf_url(base_meta["fileObjs"], "test.project-1", request)
    assert url == _get_publication_file_url("test.project-1", "entity/paper.pdf", request)


def test_get_citation_pdf_url_none_when_several_pdfs(rf):
    """With more than one PDF there's no way to tell which is the article, so none is claimed."""
    request = make_request(rf)
    base_meta = {
        "fileObjs": [
            {"type": "file", "name": "paper.pdf", "path": "/paper.pdf"},
            {"type": "file", "name": "supplement.pdf", "path": "/supplement.pdf"},
        ]
    }
    assert _get_citation_pdf_url(base_meta["fileObjs"], "test.project-1", request) is None


def test_get_citation_pdf_url_ignores_incomplete_entries_when_counting(rf):
    """A PDF entry missing its name or path isn't a usable file, so it doesn't make the real one ambiguous."""
    request = make_request(rf)
    base_meta = {
        "fileObjs": [
            {"type": "file", "name": "", "path": "/broken.pdf"},
            {"type": "dir", "name": "folder.pdf", "path": "/folder.pdf"},
            {"type": "file", "name": "paper.pdf", "path": "/paper.pdf"},
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
    # Browsers won't open a PDF in a sandboxed document.
    assert "Content-Security-Policy" not in response
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


@pytest.mark.parametrize("name", ["page.html", "page.htm", "image.svg", "feed.xml", "page.xhtml", "script.js"])
def test_publication_file_download_view_downloads_scriptable_types(rf, requests_mock, name):
    """An author-supplied HTML, SVG or XML file shown inline would run script on the portal's
    origin, so it's sent as a sandboxed octet-stream download."""
    Publication.objects.create(
        project_id="test.project-1",
        value=valid_base_meta(fileObjs=[{"type": "file", "name": name, "path": f"/{name}"}]),
        tree={},
        version=1,
    )
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/{name}", content=b"<script>")

    response = PublicationFileDownloadView.as_view()(make_request(rf), project_id="test.project-1", path=name)

    assert response["Content-Type"] == "application/octet-stream"
    assert response["Content-Disposition"] == f'attachment; filename="{name}"'
    assert response["Content-Security-Policy"] == "sandbox"


@pytest.mark.parametrize(
    "name,content_type",
    [("cover.png", "image/png"), ("cover.jpg", "image/jpeg"), ("notes.txt", "text/plain"), ("a.csv", "text/csv")],
)
def test_publication_file_download_view_shows_safe_types_inline_sandboxed(rf, requests_mock, name, content_type):
    Publication.objects.create(
        project_id="test.project-1",
        value=valid_base_meta(fileObjs=[{"type": "file", "name": name, "path": f"/{name}"}]),
        tree={},
        version=1,
    )
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/{name}", content=b"bytes")

    response = PublicationFileDownloadView.as_view()(make_request(rf), project_id="test.project-1", path=name)

    assert response["Content-Type"] == content_type
    assert response["Content-Disposition"] == f'inline; filename="{name}"'
    assert response["Content-Security-Policy"] == "sandbox"


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


@pytest.mark.parametrize("web_base_url", [None, "https://web.example.org/published"])
def test_publication_file_download_view_404s_for_unpublished_publication(
    rf, settings, requests_mock, v1_publication, web_base_url
):
    """A withdrawn publication's declared files are neither streamed nor redirected to."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = web_base_url
    v1_publication.is_published = False
    v1_publication.save()
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="data.csv")
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


@pytest.mark.parametrize("exc", [requests.exceptions.ConnectionError, requests.exceptions.ConnectTimeout])
@patch("portal.apps.public_data.views.logger")
def test_publication_file_download_view_502s_when_tapis_unreachable(
    mock_logger, rf, requests_mock, v1_publication, exc
):
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/a.csv", exc=exc)
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="a.csv")

    assert response.status_code == 502
    mock_logger.exception.assert_called_once()
    assert "test.project.published.test.project-1/a.csv" in mock_logger.exception.call_args.args[0]


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

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path="a.csv")

    assert response.status_code == 302
    assert response["Location"] == f"{WEB_BASE_URL}/test.project-1/a.csv"
    assert not requests_mock.called


@pytest.mark.parametrize("path", ["files/paper.pdf", "files/PAPER.PDF"])
def test_publication_file_download_view_streams_pdfs_despite_web_mirror(
    rf, settings, requests_mock, v1_publication, path
):
    """A PDF is relayed from Tapis even with a web mirror configured, so citation_pdf_url's bytes
    come from the portal host rather than a redirect to another one."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    v1_publication.tree = entity_tree({"type": "file", "name": posixpath.basename(path), "path": f"/{path}"})
    v1_publication.save()
    requests_mock.get(
        f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/{path}",
        content=b"%PDF-1.7 bytes",
    )
    request = make_request(rf)

    response = PublicationFileDownloadView.as_view()(request, project_id="test.project-1", path=path)

    assert response.status_code == 200
    assert response["Content-Type"] == "application/pdf"
    assert b"".join(response.streaming_content) == b"%PDF-1.7 bytes"


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
        {"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif", "sha256": "aa11"},
        {"type": "file", "name": "paper.pdf", "path": "/sample1/paper.pdf", "sha256": "bb22"},
        {
            "type": "file",
            "name": "table.csv",
            "path": "/sample1/table.csv",
            "sha256": "cc33",
            "columns": [{"name": "x"}],
        },
        {"type": "dir", "name": "raw", "path": "/sample1/raw"},
    )
    publication.save()
    request = make_request(rf)

    citation_meta, schema, _ = get_citation_context(publication, request)

    distribution_ids = [file_object["@id"] for file_object in schema["distribution"]]
    # Root-level data.csv first, then the entity's files; with no ZIP, the directory is left out.
    assert distribution_ids == [
        f"{FILES_URL}{path}" for path in ("data.csv", "sample1/scan.tif", "sample1/paper.pdf", "sample1/table.csv")
    ]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"
    assert {record_set["@id"] for record_set in schema["recordSet"]} == {
        f"{FILES_URL}data.csv#records",
        f"{FILES_URL}sample1/table.csv#records",
    }
    assert citation_meta["entities"][0]["pdf_url"] == _get_publication_file_url(
        publication.project_id, "sample1/paper.pdf", request
    )
    # Everything advertised is something the file route will actually serve.
    for entry in schema["distribution"]:
        assert _is_publication_file_path(publication, unquote(entry["contentUrl"].removeprefix(FILES_URL)))


def test_entity_only_files_still_make_publication_a_croissant_candidate(rf, settings, publication):
    """A publication whose files are all on entity nodes (nothing on the project root) used to
    count as fileless: no distribution and no conformsTo."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.value = valid_base_meta(fileObjs=[])
    publication.tree = entity_tree({"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif", "sha256": "aa11"})
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))

    assert [file_object["@id"] for file_object in schema["distribution"]] == [f"{FILES_URL}sample1/scan.tif"]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"


def test_get_publication_file_objs_combines_root_and_entity_nodes_deduped_by_path(publication):
    publication.tree = entity_tree(
        {"type": "file", "name": "paper.pdf", "path": "/files/paper.pdf"},
        # Same file as the root's data.csv, with/without a leading slash -- listed once.
        {"type": "file", "name": "data.csv", "path": "data.csv"},
    )

    paths = sorted(file_obj["path"].strip("/") for file_obj in _get_publication_file_objs(publication))

    assert paths == ["data.csv", "files/paper.pdf"]


def test_get_publication_file_objs_skips_file_objects_without_a_path(publication):
    publication.tree = entity_tree(
        {"type": "file", "name": "no-path.bin"},
        {"type": "file", "name": "empty.bin", "path": ""},
        {"type": "file", "name": "root.bin", "path": "/"},
    )

    assert [file_obj["path"] for file_obj in _get_publication_file_objs(publication)] == ["/data.csv"]


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


def test_cover_image_view_404s_for_unpublished_publication(rf, settings, publication, requests_mock):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    publication.is_published = False
    publication.save()
    request = make_request(rf)

    with pytest.raises(Http404):
        PublicationCoverImageView.as_view()(request, project_id=publication.project_id)
    assert not requests_mock.called


# ---------------------------------------------------------------------------
# Whole-publication ZIP: PublicationArchiveView and its `distribution` entry
# ---------------------------------------------------------------------------

ARCHIVE_URL = "http://testserver/published-datasets/test.project.published.test.project-1/archive.zip"
ARCHIVE_SHA256 = "e" * 64


@pytest.fixture
def archived_publication(publication, settings):
    """`publication` (v3) with its ZIP's checksum stored and a web mirror configured."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    publication.archive_sha256 = ARCHIVE_SHA256
    publication.archive_size = 3_000_000_000
    publication.value = valid_base_meta(
        fileObjs=[
            *valid_base_meta()["fileObjs"],
            {"type": "dir", "name": "raw", "path": "/sample1/raw"},
        ]
    )
    publication.save()
    return publication


def test_archive_route_is_matched_before_subpath_not_found(publication):
    url = reverse("publications:archive", kwargs={"project_id": publication.project_id})

    assert url == "/published-datasets/test.project.published.test.project-1/archive.zip"
    assert resolve(url).url_name == "archive"


def test_archive_route_redirects_to_current_versions_zip_on_web_mirror(client, archived_publication, requests_mock):
    response = client.get(reverse("publications:archive", kwargs={"project_id": archived_publication.project_id}))

    assert response.status_code == 302
    assert response["Location"] == f"{WEB_BASE_URL}/archive/test.project-1v3/test.project-1v3_archive.zip"
    assert not requests_mock.called


@pytest.mark.parametrize("missing", ["checksum", "web_mirror", "published"])
def test_archive_view_404s_without_checksum_web_mirror_or_publication(rf, settings, archived_publication, missing):
    if missing == "checksum":
        archived_publication.archive_sha256 = ""
    elif missing == "published":
        archived_publication.is_published = False
    else:
        settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = None
    archived_publication.save()

    with pytest.raises(Http404):
        PublicationArchiveView.as_view()(make_request(rf), project_id=archived_publication.project_id)


def test_archive_view_404s_for_unknown_publication(rf, settings, db):
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL

    with pytest.raises(Http404):
        PublicationArchiveView.as_view()(make_request(rf), project_id="test.project-999")


def test_get_archive_file_object(rf, archived_publication):
    assert _get_archive_file_object(archived_publication, make_request(rf)) == {
        "@type": ["cr:FileObject", "DataDownload"],
        "@id": ARCHIVE_URL,
        "name": "test.project-1v3_archive.zip",
        "contentUrl": ARCHIVE_URL,
        "encodingFormat": "application/zip",
        "contentSize": "3.0 GB",
        "sha256": ARCHIVE_SHA256,
    }


def test_get_archive_file_object_without_size_omits_content_size(rf, archived_publication):
    archived_publication.archive_size = None

    assert "contentSize" not in _get_archive_file_object(archived_publication, make_request(rf))


@pytest.mark.parametrize("missing", ["checksum", "web_mirror"])
def test_get_archive_file_object_none_without_checksum_or_web_mirror(rf, settings, archived_publication, missing):
    if missing == "checksum":
        archived_publication.archive_sha256 = ""
    else:
        settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = None

    assert _get_archive_file_object(archived_publication, make_request(rf)) is None


def test_schema_org_json_lists_archive_and_points_file_sets_into_it(rf, settings, archived_publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))

    file_set = next(entry for entry in schema["distribution"] if _has_type(entry, "cr:FileSet"))
    assert file_set["@type"] == ["cr:FileSet", "DataDownload"]
    assert file_set["contentUrl"] == ARCHIVE_URL
    assert file_set["containedIn"] == {"@id": ARCHIVE_URL}
    assert file_set["includes"] == "test.project-1v3/sample1/raw/**"
    assert file_set["@id"] == f"{FILES_URL}sample1/raw/"
    assert schema["distribution"][-1]["@id"] == ARCHIVE_URL
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"


@pytest.mark.parametrize("missing", ["checksum", "web_mirror"])
def test_schema_org_json_without_archive_omits_directories(rf, settings, archived_publication, missing):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    if missing == "checksum":
        archived_publication.archive_sha256 = ""
    else:
        settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = None

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))

    assert [entry["@id"] for entry in schema["distribution"]] == [f"{FILES_URL}data.csv"]


def test_schema_org_json_fileless_publication_lists_no_archive(rf, settings, archived_publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    archived_publication.value = valid_base_meta(fileObjs=[])

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))

    assert "distribution" not in schema


@pytest.mark.parametrize(
    "entry,expected",
    [
        ({"@type": "cr:FileObject"}, True),
        ({"@type": ["cr:FileObject", "DataDownload"]}, True),
        ({"@type": ["cr:FileSet", "DataDownload"]}, False),
        ({"@type": "cr:FileSet"}, False),
        ({}, False),
    ],
)
def test_has_type(entry, expected):
    assert _has_type(entry, "cr:FileObject") is expected


def test_schema_org_json_with_archive_passes_mlcroissant_validation(rf, settings, archived_publication, tmp_path):
    """The ZIP entry (dual-typed, with its sha256) and FileSets `containedIn` it validate with no
    errors or warnings, and mlcroissant keeps each FileSet's link to the ZIP -- which it silently
    drops unless the 1.1 @context maps `containedIn` to cr:containedIn."""
    mlc = pytest.importorskip("mlcroissant")
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"
    jsonld_path = tmp_path / "croissant.json"
    jsonld_path.write_text(json.dumps(schema))

    metadata = mlc.Dataset(jsonld=jsonld_path).metadata
    assert not metadata.ctx.issues.errors
    assert not metadata.ctx.issues.warnings
    archive_id = next(entry["@id"] for entry in schema["distribution"] if entry["encodingFormat"] == "application/zip")
    file_sets = [entry for entry in metadata.distribution if isinstance(entry, mlc.FileSet)]
    assert file_sets
    assert all(file_set.contained_in == [archive_id] for file_set in file_sets)


# ---------------------------------------------------------------------------
# PublicationCroissantView
# ---------------------------------------------------------------------------


def test_croissant_route_serves_landing_pages_json_ld(client, publication):
    url = reverse("publications:croissant", kwargs={"project_id": publication.project_id})

    response = client.get(url)

    assert response.status_code == 200
    assert response["Content-Type"] == 'application/ld+json; profile="http://mlcommons.org/croissant/1.1"'
    assert response["Access-Control-Allow-Origin"] == "*"
    page = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()
    embedded = re.search(r'<script type="application/ld\+json">(.*?)</script>', page, re.DOTALL).group(1)
    assert json.loads(response.content) == json.loads(embedded)


def test_croissant_route_is_matched_before_index_fallback(publication):
    url = reverse("publications:croissant", kwargs={"project_id": publication.project_id})

    assert url == "/published-datasets/test.project.published.test.project-1/croissant.json"
    assert resolve(url).url_name == "croissant"


def test_croissant_route_does_not_html_escape_json(client, publication):
    publication.value = valid_base_meta(title="Rocks <&> pores")
    publication.save()
    url = reverse("publications:croissant", kwargs={"project_id": publication.project_id})

    assert json.loads(client.get(url).content)["name"] == "Rocks <&> pores"


def test_croissant_view_404s_for_unknown_publication(rf):
    with pytest.raises(Http404):
        PublicationCroissantView.as_view()(make_request(rf), project_id="test.project-999")


@pytest.mark.parametrize("field", ["is_published", "is_indexable"])
def test_croissant_view_404s_for_publication_without_landing_page_metadata(rf, publication, field):
    setattr(publication, field, False)
    publication.save()

    with pytest.raises(Http404):
        PublicationCroissantView.as_view()(make_request(rf), project_id=publication.project_id)


def test_croissant_view_404s_without_conformance(rf, publication):
    """An unhashed file withholds conformsTo (see get_schema_org_json), so there's no Croissant to serve."""
    publication.tree = entity_tree({"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif"})
    publication.save()

    with pytest.raises(Http404):
        PublicationCroissantView.as_view()(make_request(rf), project_id=publication.project_id)


@patch("portal.apps.public_data.views.logger")
def test_croissant_view_404s_and_logs_when_metadata_fails_to_build(mock_logger, rf, publication):
    publication.value = valid_base_meta(title=None)
    publication.save()

    with pytest.raises(Http404):
        PublicationCroissantView.as_view()(make_request(rf), project_id=publication.project_id)
    mock_logger.exception.assert_called_once()


def test_index_view_links_croissant_json_ld(client, settings, publication):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://data.example.org/published-datasets"
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    croissant_url = "https://data.example.org/published-datasets/test.project.published.test.project-1/croissant.json"
    assert f'<link rel="alternate" type="application/ld+json" href="{croissant_url}">' in body


def test_index_view_omits_croissant_link_without_conformance(client, publication):
    publication.tree = entity_tree({"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif"})
    publication.save()
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert '<script type="application/ld+json">' in body
    assert 'rel="alternate" type="application/ld+json"' not in body


def test_index_view_omits_croissant_link_off_landing_pages(client):
    body = client.get("/published-datasets/not-a-real-project/").content.decode()

    assert 'rel="alternate" type="application/ld+json"' not in body


# ---------------------------------------------------------------------------
# get_schema_org_json
# ---------------------------------------------------------------------------


def test_get_schema_org_json_success(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    schema = get_schema_org_json(publication, publication.project_id, request)

    assert schema["@type"] == "Dataset"
    assert schema["name"] == "Test Dataset"
    assert schema["description"] == TEST_DESCRIPTION
    assert schema["license"] == LICENSE_URLS["ODC-BY 1.0"]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"
    assert schema["isAccessibleForFree"] is True
    assert schema["identifier"] == "https://doi.org/10.1234/test-doi"
    assert schema["sameAs"] == "https://doi.org/10.1234/test-doi"
    assert len(schema["creator"]) == 1
    assert schema["creator"][0]["name"] == "Ada Lovelace"
    # The publication-level institution isn't an author affiliation.
    assert "affiliation" not in schema["creator"][0]
    assert schema["creator"][0]["sameAs"] == "https://orcid.org/0000-0002-1825-0097"
    assert schema["publisher"] == {"@type": "Organization", "name": "Test Publisher", "url": "http://testserver/"}
    assert schema["includedInDataCatalog"] == {
        "@type": "DataCatalog",
        "name": "Test Publisher",
        "url": "http://testserver/published-datasets/",
    }
    assert schema["version"] == "3"
    assert schema["dateModified"] == publication.last_updated.isoformat()
    assert len(schema["distribution"]) == 1
    assert len(schema["recordSet"]) == 1
    assert len(schema["citation"]) == 1


@pytest.mark.parametrize("stored_doi", ["10.1234/test-doi", "doi:10.1234/test-doi", "https://doi.org/10.1234/test-doi"])
def test_get_schema_org_json_normalizes_doi(rf, publication, stored_doi):
    """A DOI stored with a "doi:" label or as a resolver URL doesn't become
    "https://doi.org/https://doi.org/..." in `identifier`, `sameAs` or `citeAs`."""
    publication.value = valid_base_meta(doi=stored_doi)
    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))

    assert schema["identifier"] == "https://doi.org/10.1234/test-doi"
    assert schema["sameAs"] == "https://doi.org/10.1234/test-doi"
    assert "doi = {10.1234/test-doi}" in schema["citeAs"]
    assert "url = {https://doi.org/10.1234/test-doi}" in schema["citeAs"]


def test_get_schema_org_json_falls_back_to_landing_page_for_unparseable_doi(rf, publication):
    publication.value = valid_base_meta(doi="not-a-doi")
    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))

    assert schema["identifier"] == schema["url"]
    assert "sameAs" not in schema
    assert "doi = " not in schema["citeAs"]
    assert f"url = {{{schema['url']}}}" in schema["citeAs"]


def test_get_schema_org_json_uses_full_croissant_1_1_context(rf, publication):
    context = get_schema_org_json(publication, publication.project_id, make_request(rf))["@context"]

    # Every key in the Croissant 1.1 spec's @context (Appendix 1), including terms this
    # document never emits.
    assert set(context) == {
        "@language", "@vocab", "sc", "cr", "rai", "dct", "annotation", "arrayShape", "citeAs",
        "column", "conformsTo", "containedIn", "data", "dataType", "equivalentProperty", "examples",
        "excludes", "extract", "field", "fileProperty", "fileObject", "fileSet", "format", "includes",
        "isArray", "isLiveDataset", "jsonPath", "key", "md5", "parentField", "recordSet", "references",
        "regex", "readLines", "sdVersion", "separator", "source", "subField", "transform", "unArchive",
        "value",
    }  # fmt: skip
    assert context["cr"] == "http://mlcommons.org/croissant/"
    assert context["conformsTo"] == "dct:conformsTo"
    assert context["containedIn"] == "cr:containedIn"
    assert context["dataType"] == {"@id": "cr:dataType", "@type": "@vocab"}
    # https, not the spec's http: mlcroissant rejects a Dataset that isn't https://schema.org/Dataset.
    assert context["@vocab"] == context["sc"] == "https://schema.org/"


def test_get_schema_org_json_context_is_not_shared_between_documents(rf, publication):
    request = make_request(rf)
    first = get_schema_org_json(publication, publication.project_id, request)
    first["@context"]["dataType"]["@type"] = "mutated"
    first["@context"]["cr"] = "mutated"

    second = get_schema_org_json(publication, publication.project_id, request)

    assert second["@context"]["dataType"] == {"@id": "cr:dataType", "@type": "@vocab"}
    assert second["@context"]["cr"] == "http://mlcommons.org/croissant/"


def test_get_schema_org_json_no_files_omits_conforms_to_and_distribution(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    publication.value = valid_base_meta(fileObjs=[{"type": "folder", "name": "dir", "path": "/dir"}])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)
    assert "conformsTo" not in schema
    assert "distribution" not in schema


def test_get_schema_org_json_directory_only_publication_conforms_with_archive(rf, settings, archived_publication):
    """A publication whose only file object is a directory gets a `distribution` (its cr:FileSet
    and the ZIP holding it) and claims Croissant: FileSets need no checksum, so nothing is unhashed."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    archived_publication.value = valid_base_meta(fileObjs=[{"type": "dir", "name": "scans", "path": "/scans"}])
    archived_publication.save()

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))
    assert [entry["@type"] for entry in schema["distribution"]] == [
        ["cr:FileSet", "DataDownload"],
        ["cr:FileObject", "DataDownload"],
    ]
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"


@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_directory_only_publication_without_archive_lists_nothing(
    mock_logger, rf, settings, publication
):
    """Without a ZIP, a directory-only publication has nothing to list -- like a fileless one, so it
    is neither a Croissant candidate nor a data bug worth a warning on every render."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.value = valid_base_meta(fileObjs=[{"type": "dir", "name": "scans", "path": "/scans"}])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))
    assert "distribution" not in schema
    assert "conformsTo" not in schema
    mock_logger.warning.assert_not_called()


def test_get_schema_org_json_unhashed_file_beside_directory_drops_conforms_to(rf, settings, archived_publication):
    """A FileSet doesn't excuse an unhashed cr:FileObject next to it."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    archived_publication.value = valid_base_meta(
        fileObjs=[
            {"type": "dir", "name": "scans", "path": "/scans"},
            {"type": "file", "name": "data.csv", "path": "/data.csv"},
        ]
    )
    archived_publication.save()

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))
    assert len(schema["distribution"]) == 3
    assert "conformsTo" not in schema


def test_schema_org_json_distribution_entries_are_all_data_downloads(rf, settings, archived_publication):
    """Google reads `distribution` as DataDownloads, each with a `contentUrl` -- an entry missing
    either is an invalid object type or a missing required field in its Rich Results Test."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"

    schema = get_schema_org_json(archived_publication, archived_publication.project_id, make_request(rf))

    assert {entry["@type"][0] for entry in schema["distribution"]} == {"cr:FileObject", "cr:FileSet"}
    for entry in schema["distribution"]:
        assert _has_type(entry, "DataDownload"), entry["@id"]
        assert entry["contentUrl"].startswith("http"), entry["@id"]


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


@patch("portal.apps.public_data.schema_org.logger")
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
@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_missing_croissant_field_still_emits_plain_dataset(
    mock_logger, rf, publication, overrides, missing_field
):
    request = make_request(rf)
    publication.value = valid_base_meta(**overrides)
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert schema["@type"] == "Dataset"
    assert schema["name"] == "Test Dataset"
    assert schema["description"] == TEST_DESCRIPTION
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

    with patch("portal.apps.public_data.schema_org.logger") as mock_logger:
        schema = get_schema_org_json(publication, publication.project_id, request)

    assert "conformsTo" not in schema
    mock_logger.warning.assert_not_called()


@patch("portal.apps.public_data.schema_org.logger")
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


@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_unhashed_file_omits_conforms_to(mock_logger, rf, settings, publication):
    """Croissant requires an md5/sha256 checksum on every cr:FileObject, so a single unhashed file
    withholds the conformsTo claim -- while the rest of the Dataset (including that file's
    distribution entry) is still emitted. Not logged: the warning is commented out until existing
    publications have checksums (see get_schema_org_json)."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.tree = entity_tree({"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif"})
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))

    assert "conformsTo" not in schema
    assert schema["@type"] == "Dataset"
    assert [file_object["@id"] for file_object in schema["distribution"]] == [
        f"{FILES_URL}data.csv",
        f"{FILES_URL}sample1/scan.tif",
    ]
    assert schema["distribution"][0]["sha256"] == "abc123"
    assert "sha256" not in schema["distribution"][1]
    # Unrelated Croissant fields are untouched.
    assert schema["license"] == LICENSE_URLS["ODC-BY 1.0"]
    assert len(schema["recordSet"]) == 1
    mock_logger.warning.assert_not_called()


def test_get_schema_org_json_every_file_hashed_keeps_conforms_to(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.tree = entity_tree({"type": "file", "name": "scan.tif", "path": "/sample1/scan.tif", "sha256": "aa11"})
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))

    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"
    assert [file_object["sha256"] for file_object in schema["distribution"]] == ["abc123", "aa11"]


def test_publication_with_unhashed_files_is_indexable_and_in_sitemap(client, settings):
    """Withholding conformsTo only drops the Croissant claim: the landing page is still indexable
    with its schema.org Dataset JSON-LD, and still listed in the sitemap."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    unhashed_file = {"type": "file", "name": "data.csv", "path": "/data.csv", "length": 2048}
    pub = Publication.objects.create(
        project_id="test.project-2",
        value=valid_base_meta(fileObjs=[unhashed_file]),
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
    assert len(schema["distribution"]) == 1
    assert "test.project-2" in client.get(reverse("sitemap")).content.decode()


def test_get_schema_org_json_creator_without_institution_or_orcid(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(
        institution="",
        authors=[{"first_name": "No", "last_name": "Orcid"}],
    )
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)
    creator = schema["creator"][0]
    assert creator == {"@type": "Person", "name": "No Orcid", "givenName": "No", "familyName": "Orcid"}
    assert "affiliation" not in creator
    assert "sameAs" not in creator


@pytest.mark.parametrize(
    "author,expected",
    [
        ({"first_name": " Ada ", "last_name": ""}, {"@type": "Person", "name": "Ada", "givenName": "Ada"}),
        (
            {"first_name": None, "last_name": "Lovelace"},
            {"@type": "Person", "name": "Lovelace", "familyName": "Lovelace"},
        ),
    ],
)
def test_get_schema_org_json_creator_omits_empty_name_parts(rf, publication, author, expected):
    publication.value = valid_base_meta(institution="", authors=[author])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))
    assert schema["creator"] == [expected]


def test_get_schema_org_json_dataset_id_is_landing_page_url(rf, publication):
    """The Dataset node is named by its landing page, the same URL as `url`, whether or not
    there's a DOI for `identifier`."""
    request = make_request(rf)
    schema = get_schema_org_json(publication, publication.project_id, request)
    assert schema["@id"] == schema["url"] == _get_landing_page_url(publication.project_id, publication.version, request)


def test_get_schema_org_json_affiliation_comes_from_each_authors_own_institution(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(
        institution="Hosting University",
        authors=[
            {**full_author(), "institution": "  Analytical Engine Society  "},
            {"first_name": "Alan", "last_name": "Turing", "institution": "   "},
            {"first_name": "Grace", "last_name": "Hopper"},
        ],
    )
    publication.save()

    creators = get_schema_org_json(publication, publication.project_id, request)["creator"]

    assert creators[0]["affiliation"] == {"@type": "Organization", "name": "Analytical Engine Society"}
    assert "affiliation" not in creators[1]
    assert "affiliation" not in creators[2]


@pytest.mark.parametrize(
    "nameless_author",
    [{}, {"first_name": "", "last_name": ""}, {"first_name": None, "last_name": None}, {"first_name": "  "}],
)
@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_leaves_out_author_with_no_name(mock_logger, rf, publication, nameless_author):
    """A Person with an empty name is invalid schema.org, so a nameless author is left out (and
    logged) rather than emitted."""
    request = make_request(rf)
    publication.value = valid_base_meta(authors=[nameless_author, {"first_name": "Ada", "last_name": "Lovelace"}])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert [creator["name"] for creator in schema["creator"]] == ["Ada Lovelace"]
    assert any("has an author with no name" in call.args[0] for call in mock_logger.warning.call_args_list)


@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_only_nameless_authors_drops_creator(mock_logger, rf, publication):
    """With no named author left there's no `creator`, which Croissant requires, so `conformsTo` is
    withheld too."""
    request = make_request(rf)
    publication.value = valid_base_meta(authors=[{"first_name": "", "last_name": ""}])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert "creator" not in schema
    assert "conformsTo" not in schema


def test_get_schema_org_json_drops_empty_optional_fields(rf, publication):
    request = make_request(rf)
    publication.value = valid_base_meta(keywords="", relatedPublications=[])
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)
    assert "keywords" not in schema
    assert "citation" not in schema


@pytest.mark.parametrize("length", [49, 5001])
@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_warns_on_description_outside_google_length_range(mock_logger, rf, publication, length):
    """Google Dataset Search expects 50-5000 characters; outside that the Dataset is still emitted,
    with a warning."""
    request = make_request(rf)
    publication.value = valid_base_meta(description="x" * length)
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, request)

    assert schema["description"] == "x" * length
    assert any(f"{length}-character description" in call.args[0] for call in mock_logger.warning.call_args_list)


@pytest.mark.parametrize("length", [50, 5000])
@patch("portal.apps.public_data.schema_org.logger")
def test_get_schema_org_json_no_warning_for_description_within_google_length_range(
    mock_logger, rf, publication, length
):
    request = make_request(rf)
    publication.value = valid_base_meta(description="x" * length)
    publication.save()

    get_schema_org_json(publication, publication.project_id, request)

    assert not any("character description" in call.args[0] for call in mock_logger.warning.call_args_list)


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


def test_get_citation_context_normalizes_doi(rf, publication):
    publication.value = valid_base_meta(doi="https://doi.org/10.1234/test-doi")
    citation_meta, _, _ = get_citation_context(publication, make_request(rf))

    entity = citation_meta["entities"][0]
    assert entity["doi"] == "10.1234/test-doi"
    assert entity["doi_url"] == "https://doi.org/10.1234/test-doi"
    assert entity["apa_citation"].endswith(" https://doi.org/10.1234/test-doi")


def test_get_citation_context_collects_file_objects_once(rf, publication):
    """The JSON-LD distribution and citation_pdf_url share one walk of the publication's files."""
    publication.value = valid_base_meta(
        fileObjs=[{"type": "file", "name": "paper.pdf", "path": "/paper.pdf", "sha256": "abc123"}]
    )
    publication.save()

    with patch(
        "portal.apps.public_data.schema_org._get_publication_file_objs", wraps=_get_publication_file_objs
    ) as mock_file_objs:
        citation_meta, schema, _ = get_citation_context(publication, make_request(rf))

    mock_file_objs.assert_called_once_with(publication)
    assert schema["distribution"][0]["name"] == "paper.pdf"
    assert citation_meta["entities"][0]["pdf_url"] == schema["distribution"][0]["contentUrl"]


@pytest.mark.parametrize(
    "author,expected",
    [
        ({"first_name": None, "last_name": "Lovelace"}, ["Lovelace"]),
        ({"first_name": "Ada", "last_name": None}, ["Ada"]),
        ({"first_name": None, "last_name": None}, []),
    ],
)
def test_get_citation_context_dc_creators_treat_null_name_parts_as_missing(rf, publication, author, expected):
    """A name part stored as null is left out, never rendered as the string "None"."""
    request = make_request(rf)
    publication.value = valid_base_meta(authors=[author])
    publication.save()

    citation_meta, _, _ = get_citation_context(publication, request)

    assert citation_meta["entities"][0]["dc_creators"] == expected


def test_get_citation_context_keywords_list_is_joined(rf, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    publication.value = valid_base_meta(keywords=["alpha", "beta", "gamma"])
    publication.save()

    citation_meta, _, _ = get_citation_context(publication, request)
    assert citation_meta["keywords"] == "alpha, beta, gamma"


@pytest.mark.parametrize("keywords", [["one", " two", "three ", "  "], " one,two ,  three, "])
def test_get_citation_context_trims_keywords_in_json_ld_and_meta_tag(rf, settings, publication, keywords):
    """Keywords are trimmed (and blanks dropped) the same way DataCite's `subjects` are, whether
    stored as a list (the DPMP "tags" field, which can keep stray spaces) or as a string."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    request = make_request(rf)
    publication.value = valid_base_meta(keywords=keywords)
    publication.save()

    citation_meta, schema_org_json, _ = get_citation_context(publication, request)
    assert schema_org_json["keywords"] == ["one", "two", "three"]
    assert citation_meta["keywords"] == "one, two, three"


def test_index_view_renders_trimmed_keywords_meta_tag(client, publication):
    publication.value = valid_base_meta(keywords=["one", " two"])
    publication.save()

    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert "<meta name=\"keywords\" content='one, two'>" in body
    assert '"keywords": ["one", "two"]' in body


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
# These render the real landing page. unit_test_settings.py swaps the workbench index.html for its
# index.j2 build template (see WORKBENCH_INDEX_TEMPLATE there), so they run with DEBUG off, as
# production does.


def test_index_view_renders_publication(client, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    url = get_landing_page_path(publication.project_id, publication.version)
    response = client.get(url)

    assert response.status_code == 200
    assert response.context["setup_complete"] is False
    assert response.context["publisher"] == "Test Publisher"
    assert "schema_org_json" in response.context
    assert response.context["canonical_url"] == "http://testserver" + url


def _react_root(body):
    match = re.search(r'<div id="react-root">(.*?)</div>', body, re.S)
    assert match is not None
    return match.group(1)


def test_index_view_renders_visible_summary_inside_react_root(client, publication):
    """Crawlers that don't run JavaScript see the title, authors, abstract and DOI in the page body."""
    publication.value = valid_base_meta(description="Line one & <two>\nLine three")
    publication.save()
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()
    summary = _react_root(body)

    assert "<h1>Test Dataset</h1>" in summary
    assert "<p>Ada Lovelace</p>" in summary
    assert "<p>Line one &amp; &lt;two&gt;<br>Line three</p>" in summary
    assert '<a href="https://doi.org/10.1234/test-doi">https://doi.org/10.1234/test-doi</a>' in summary


def test_index_view_summary_shows_apa_and_bibtex_citations(client, settings, publication):
    """The APA citation is shown for readers, and the BibTeX entry the JSON-LD gives as citeAs is
    shown with it, both HTML-escaped."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.value = valid_base_meta(title="Rocks & <pores>")
    publication.save()
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()
    summary = _react_root(body)

    assert (
        "<p>Cite as: Lovelace, A. (2024). Rocks &amp; &lt;pores&gt;. Test Publisher. https://doi.org/10.1234/test-doi</p>"
        in summary
    )
    payload = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', body, re.DOTALL).group(1))
    assert payload["citeAs"].startswith("@misc{lovelace2024,\n")
    assert f"<pre>{escape(payload['citeAs'])}</pre>" in summary


def test_index_view_summary_omits_missing_doi(client, publication):
    publication.value = valid_base_meta(doi=None)
    publication.save()
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert "DOI:" not in _react_root(body)


def test_index_view_leaves_react_root_empty_off_landing_pages(client, publication):
    publication.is_published = False
    publication.save()
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert _react_root(body).strip() == ""


def test_index_view_missing_publication_404s(client):
    url = reverse("publications:index", kwargs={"project_id": "test.project-999"})
    response = client.get(url)
    assert response.status_code == 404


@patch("portal.apps.public_data.views.get_citation_context")
@patch("portal.apps.public_data.views.logger")
def test_index_view_unpublished_publication_renders_noindex_without_metadata(
    mock_logger, mock_get_citation_context, client, publication
):
    """A withdrawn publication's DOI still resolves to a page (not a 404), but one with no
    citation/JSON-LD metadata and left noindex -- the same pages SitemapView leaves out."""
    publication.is_published = False
    publication.save()

    url = get_landing_page_path(publication.project_id, publication.version)
    response = client.get(url)
    body = response.content.decode()

    assert response.status_code == 200
    assert "schema_org_json" not in response.context
    assert "citation_context" not in response.context
    assert "canonical_url" not in response.context
    mock_get_citation_context.assert_not_called()
    mock_logger.info.assert_called_once()
    assert publication.project_id in mock_logger.info.call_args[0][0]
    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert robots_match.group(1).strip() == "noindex, follow"
    assert "citation_title" not in body
    assert "application/ld+json" not in body


@patch("portal.apps.public_data.views.logger")
def test_index_view_revision_mismatch_logs_warning(mock_logger, client, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    response = client.get(f"/published-datasets/test.project.published.{publication.project_id}v99/")

    assert response.status_code == 301
    mock_logger.warning.assert_called_once()
    assert str(publication.project_id) in mock_logger.warning.call_args[0][0]


@patch("portal.apps.public_data.views.logger")
def test_index_view_schema_org_validation_error_is_caught_and_logged(mock_logger, client, publication):
    publication.value = valid_base_meta(title=None)
    publication.save()

    url = get_landing_page_path(publication.project_id, publication.version)
    response = client.get(url)

    assert response.status_code == 200
    assert response.context["setup_complete"] is False
    assert "schema_org_json" not in response.context
    mock_logger.exception.assert_called_once()


@pytest.mark.parametrize(
    "path_template",
    [
        "/published-datasets/test.project.published.{project_id}",
        "/published-datasets/test.project.published.{project_id}/",
        "/published-datasets/test.project.published.{project_id}v3/",
        "/published-datasets/test.project.published.{project_id}v1",
        "/published-datasets/test.project.published.{project_id}v1/",
        "/public-data/test.project.published.{project_id}",
    ],
)
def test_index_view_redirects_non_canonical_urls(client, publication, path_template):
    """Alternate forms of the landing URL 301 to the canonical path instead of serving 200 duplicates."""
    canonical_path = get_landing_page_path(publication.project_id, publication.version)
    response = client.get(path_template.format(project_id=publication.project_id))

    assert response.status_code == 301
    assert response["Location"] == canonical_path


def test_index_view_canonical_url_names_current_versions_system(client, publication):
    """A republish's landing page lives at its own `vN` system id, which the client app reads off
    the URL to load that version's files -- the bare id is version 1's system."""
    canonical_path = get_landing_page_path(publication.project_id, publication.version)
    assert canonical_path == f"/published-datasets/test.project.published.{publication.project_id}v3"

    response = client.get(f"/published-datasets/test.project.published.{publication.project_id}")

    assert response.status_code == 301
    assert response["Location"] == canonical_path
    assert client.get(canonical_path).context["canonical_url"] == f"http://testserver{canonical_path}"


def test_index_view_redirect_keeps_query_string(client, publication):
    canonical_path = get_landing_page_path(publication.project_id, publication.version)
    response = client.get(f"{canonical_path}/?utm_source=x&a=1")

    assert response.status_code == 301
    assert response["Location"] == f"{canonical_path}?utm_source=x&a=1"


def test_index_view_canonical_url_is_not_redirected(client, publication):
    response = client.get(get_landing_page_path(publication.project_id, publication.version))
    assert response.status_code == 200


def test_index_view_unpublished_publication_is_not_redirected(client, publication):
    """Only pages with a canonical URL redirect; a withdrawn tombstone answers wherever it's requested."""
    publication.is_published = False
    publication.save()

    response = client.get(f"/published-datasets/test.project.published.{publication.project_id}/")
    assert response.status_code == 200


@pytest.mark.parametrize(
    "path_template",
    [
        "/published-datasets/test.project.published.{project_id}",
        "/published-datasets/test.project.published.{project_id}/",
        "/published-datasets/test.project.published.{project_id}v1",
        "/public-data/test.project.published.{project_id}",
    ],
)
@patch("portal.apps.public_data.views.logger")
def test_index_view_metadata_failure_is_not_redirected(mock_logger, client, publication, path_template):
    """When the metadata fails to build there's no canonical URL to redirect to, so a
    non-canonical URL renders the noindex shell where it's requested instead of 301ing."""
    publication.value = valid_base_meta(title=None)
    publication.save()

    response = client.get(path_template.format(project_id=publication.project_id))

    assert response.status_code == 200
    assert "canonical_url" not in response.context
    assert "schema_org_json" not in response.context
    mock_logger.exception.assert_called_once()


@pytest.mark.parametrize(
    "suffix",
    ["files/data/a%20b.csv", "cover-image", "archive.zip", "croissant.json", "croissant.json?x=1&y=2"],
)
def test_publication_routes_under_public_data_mount_redirect_to_published_datasets(client, suffix):
    """The landing page links to these under /published-datasets/; the /public-data/ mount would
    otherwise serve 200 duplicates of them."""
    response = client.get(f"/public-data/test.project.published.test.project-1/{suffix}")

    assert response.status_code == 301
    assert response["Location"] == f"/published-datasets/test.project.published.test.project-1/{suffix}"


@pytest.mark.parametrize("prefix", [None, "", "https://cep.test/public-data", "https://cep.test/data/tapis/projects"])
def test_other_portals_landing_pages_stay_under_public_data(client, settings, publication, prefix):
    """A portal whose prefix doesn't point at /published-datasets -- which Camino doesn't route to
    the portal -- keeps its landing pages, and every URL they link to, under /public-data/."""
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = prefix
    path = "/public-data/test.project.published.test.project-1v3"

    response = client.get(path)

    assert response.status_code == 200
    assert urlsplit(response.context["canonical_url"]).path == path
    schema_org_json = json.loads(response.context["schema_org_json"])
    assert all("/published-datasets/" not in entry["@id"] for entry in schema_org_json["distribution"])


@pytest.mark.parametrize("suffix", ["files/data.csv", "croissant.json"])
def test_other_portals_publication_routes_redirect_to_public_data(client, settings, publication, suffix):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = ""

    response = client.get(f"/published-datasets/test.project.published.test.project-1/{suffix}")

    assert response.status_code == 301
    assert response["Location"] == f"/public-data/test.project.published.test.project-1/{suffix}"


ENTITY_ID = "0b6a2a8e-6f1d-4c7e-9a3b-2f5d8c1e4a90"


@pytest.mark.parametrize(
    "path",
    [
        "/published-datasets/test.project.published.test.project-1v3/croissant.json",
        "/published-datasets/test.project.published.test.project-1v3/files/data.csv",
        "/published-datasets/test.project.published.test.project-1v3/cover-image",
        "/published-datasets/test.project.published.test.project-1/files",
        "/published-datasets/test.project.published.test.project-1/unknown",
        "/published-datasets/test.project.published.test.project-1/sample/not-a-uuid",
        f"/published-datasets/test.project.published.test.project-1/sample/{ENTITY_ID}/extra",
        "/published-datasets/test.project.published.test.project-999/croissant.json/",
        "/public-data/test.project.published.test.project-1v3/croissant.json",
    ],
)
def test_unknown_path_under_a_project_id_404s(client, publication, path):
    """Paths under a project id that no route serves are a real 404, not the client app at 200."""
    assert client.get(path).status_code == 404


@pytest.mark.parametrize("version_suffix", ["", "v3"])
@pytest.mark.parametrize("trailing_slash", ["", "/"])
def test_client_entity_pages_still_serve_the_app(client, publication, version_suffix, trailing_slash):
    """The DPMP client's `:system/:entity_type/:entity_id` pages stay the noindex app shell,
    without redirecting to the landing page."""
    path = f"/published-datasets/test.project.published.test.project-1{version_suffix}/sample/{ENTITY_ID}"
    response = client.get(path + trailing_slash)

    assert response.status_code == 200
    assert "canonical_url" not in response.context
    robots = re.search(r'<meta name="robots" content="([^"]*)">', response.content.decode()).group(1)
    assert robots.strip() == "noindex, follow"


def test_index_view_fallback_route_has_no_publication_context(client):
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
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    match = re.search(r'<script type="application/ld\+json">(.*?)</script>', body, re.DOTALL)
    assert match is not None
    payload = json.loads(match.group(1))
    assert payload["name"] == "Test Dataset"
    assert payload["license"] == "https://opendatacommons.org/licenses/by/1-0/"
    assert payload["@type"] == "Dataset"


class _HeadParser(HTMLParser):
    """Collects what a browser would see: <meta> tags by name/property, <title> text, the <h1>,
    and the contents of each JSON-LD <script>. Like a browser, HTMLParser ends a <script> at the
    first "</script", so text that broke out of the JSON-LD would show up as extra scripts here."""

    def __init__(self):
        super().__init__()
        self.meta = {}
        self.json_ld = []
        self.text = {}
        self._capture = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "meta" and ("name" in attrs or "property" in attrs):
            self.meta[attrs.get("name") or attrs["property"]] = attrs.get("content")
        elif tag == "script" and attrs.get("type") == "application/ld+json":
            self.json_ld.append("")
            self._capture = "json_ld"
        elif tag in ("title", "h1"):
            self.text[tag] = ""
            self._capture = tag

    def handle_endtag(self, tag):
        self._capture = None

    def handle_data(self, data):
        if self._capture == "json_ld":
            self.json_ld[-1] += data
        elif self._capture:
            self.text[self._capture] += data


def test_index_view_html_sensitive_metadata_stays_inside_its_tags(client, settings, publication):
    """A title and description containing "</script>", quotes and "&" render end to end without
    breaking out of the JSON-LD <script> or any <meta> attribute, and come back unchanged."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    title = 'Rocks </script><script>alert("t")</script> "quoted" & more'
    description = f'{TEST_DESCRIPTION} </script><script>alert("d")</script> "quoted" & <b>bold</b>'
    publication.value = valid_base_meta(title=title, description=description)
    publication.save()

    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()
    parser = _HeadParser()
    parser.feed(body)

    assert 'alert("t")</script>' not in body
    assert 'alert("d")</script>' not in body
    assert len(parser.json_ld) == 1
    payload = json.loads(parser.json_ld[0])
    assert payload["name"] == title
    assert payload["description"] == description
    for name in ("citation_title", "DC.title"):
        assert parser.meta[name] == title
    assert parser.meta["og:title"] == f"{title} | Test Publisher"
    assert parser.text["title"] == f"{title} | Test Publisher"
    assert parser.text["h1"] == title
    assert parser.meta["description"] == parser.meta["og:description"]
    assert parser.meta["description"].startswith(TEST_DESCRIPTION)


WORKBENCH_TEMPLATES = Path(__file__).resolve().parents[1] / "workbench/templates/portal/apps/workbench"
# The only block the two templates are meant to differ in: index.j2, the template CI and the tests
# render, loads no client assets, and index.html, the one deployed, loads Vite or includes the
# client build's output.
_BUILD_ONLY_BLOCKS = re.compile(r"{%\s*block\s+scripts\s*%}.*?{%\s*endblock\s*%}", re.S)


def test_workbench_index_html_and_j2_agree_outside_scripts():
    """Tests render index.j2 (unit_test_settings.py), but local development renders index.html, and
    the two are kept in sync by hand. Everything except the scripts block -- the head metadata,
    every block override and the server-rendered summary -- must be identical."""
    j2 = (WORKBENCH_TEMPLATES / "index.j2").read_text()
    html = (WORKBENCH_TEMPLATES / "index.html").read_text()

    for template in (j2, html):
        assert len(_BUILD_ONLY_BLOCKS.findall(template)) == 1
        for block in ("google_citation_meta", "robots", "title", "content"):
            assert re.search(rf"{{%\s*block\s+{block}\s*%}}", template), block
    assert _BUILD_ONLY_BLOCKS.sub("", j2) == _BUILD_ONLY_BLOCKS.sub("", html)


def test_index_view_renders_citation_and_dc_meta_tags(client, settings, publication):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    assert '<meta name="citation_title" content="Test Dataset">' in body
    assert '<meta name="citation_author" content="Lovelace, Ada">' in body
    assert '<meta name="citation_doi" content="10.1234/test-doi">' in body
    assert '<meta name="citation_publisher" content="Test Publisher">' in body
    assert '<meta name="DC.title" content="Test Dataset">' in body
    assert '<meta name="DC.creator" content="Ada Lovelace">' in body
    assert '<meta name="DC.rights" content="https://opendatacommons.org/licenses/by/1-0/">' in body
    assert '<meta name="DC.identifier" content="https://doi.org/10.1234/test-doi">' in body


@pytest.mark.parametrize("overrides", [{"authors": []}, {"publicationDate": None}], ids=["no_authors", "no_date"])
def test_index_view_omits_scholar_tags_without_authors_and_date(client, publication, overrides):
    """Scholar requires at least one author and a publication date, so a partial citation_* set
    isn't emitted. The Dublin Core tags and JSON-LD still are."""
    publication.value = valid_base_meta(
        fileObjs=[{"type": "file", "name": "paper.pdf", "path": "/files/paper.pdf"}], **overrides
    )
    publication.save()

    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert 'name="citation_' not in body
    assert '<meta name="DC.title" content="Test Dataset">' in body
    assert "application/ld+json" in body


def test_index_view_renders_citation_pdf_url_when_pdf_present(client):
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


def test_index_view_renders_title_and_description_from_publication(client, publication):
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    title_match = re.search(r"<title>(.*?)</title>", body, re.DOTALL)
    assert title_match is not None
    assert title_match.group(1).strip() == "Test Dataset | test"
    assert TEST_DESCRIPTION in body


@pytest.mark.parametrize("on_publication_route", [True, False])
def test_index_view_names_publisher_on_landing_pages_only(client, settings, publication, on_publication_route):
    """A landing page's title suffix and og:site_name name the publisher; every other page keeps
    the portal namespace."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    if on_publication_route:
        url = get_landing_page_path(publication.project_id, publication.version)
    else:
        url = "/published-datasets/"
    body = client.get(url).content.decode()

    title = re.search(r"<title>(.*?)</title>", body, re.S).group(1)
    og_title = re.search(r'<meta property="og:title" content="([^"]*)">', body).group(1)
    site_name = re.search(r'<meta property="og:site_name" content="([^"]*)">', body).group(1)
    if on_publication_route:
        assert title == og_title == "Test Dataset | Test Publisher"
        assert site_name == "Test Publisher"
    else:
        assert title == og_title == "test Workbench"
        assert site_name == "test"


def test_index_view_publication_route_is_indexable(client, publication):
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    assert 'content="' in body
    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert "index, follow, max-image-preview:large" in robots_match.group(1)


ROBOTS_META = re.compile(r'<meta name="robots" content="([^"]*)">')


def test_index_view_app_shell_has_no_robots_tag_unless_portal_opts_in(client, settings):
    """Only portals that set PORTAL_NOINDEX_APP_SHELL (DPMP) mark the app shell noindex."""
    settings.PORTAL_NOINDEX_APP_SHELL = False

    assert ROBOTS_META.search(client.get("/published-datasets/").content.decode()) is None


def test_index_view_landing_page_is_indexable_without_portal_opt_in(client, settings, publication):
    settings.PORTAL_NOINDEX_APP_SHELL = False
    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert ROBOTS_META.findall(body) == ["index, follow, max-image-preview:large"]


SHARE_CARD_META = re.compile(r'<meta (?:property="og:|name="twitter:)')


def test_index_view_app_shell_keeps_default_head_unless_portal_opts_in(client, settings):
    """Portals that don't set PORTAL_NOINDEX_APP_SHELL keep their own site description and get no
    dataset-portal share-card tags on their app shell."""
    settings.PORTAL_NOINDEX_APP_SHELL = False
    body = client.get("/published-datasets/").content.decode()

    assert SHARE_CARD_META.search(body) is None
    assert "Explore published research datasets" not in body
    assert '<meta name="description" content="">' in body


def test_index_view_app_shell_has_share_cards_when_portal_opts_in(client):
    body = client.get("/published-datasets/").content.decode()

    assert '<meta property="og:url" content="http://testserver/published-datasets/">' in body
    assert "Explore published research datasets and computational tools on test." in body


def test_index_view_landing_page_has_share_cards_without_portal_opt_in(client, settings, publication):
    settings.PORTAL_NOINDEX_APP_SHELL = False
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    assert f'<meta property="og:url" content="http://testserver{url}">' in body
    assert re.search(r'<meta property="og:title" content="Test Dataset \| [^"]*">', body)


@pytest.mark.parametrize("noindex_app_shell", [True, False])
def test_index_view_app_shell_canonical_url_drops_query_string(client, settings, noindex_app_shell):
    settings.PORTAL_NOINDEX_APP_SHELL = noindex_app_shell
    body = client.get("/published-datasets/?utm_source=x&page=2").content.decode()

    assert '<link rel="canonical" href="http://testserver/published-datasets/">' in body
    assert "utm_source" not in body


@pytest.mark.parametrize("state", ["withdrawn", "mid_publish"])
@pytest.mark.parametrize("noindex_app_shell", [True, False])
def test_index_view_unindexable_publication_is_noindex_either_way(
    client, settings, publication, state, noindex_app_shell
):
    """A withdrawn or mid-publish landing page stays noindex whether or not the portal opts its app
    shell in, and carries exactly one robots tag."""
    settings.PORTAL_NOINDEX_APP_SHELL = noindex_app_shell
    if state == "withdrawn":
        publication.is_published = False
    else:
        publication.is_indexable = False
    publication.save()

    body = client.get(get_landing_page_path(publication.project_id, publication.version)).content.decode()

    assert ROBOTS_META.findall(body) == ["noindex, follow"]


@pytest.mark.parametrize("on_publication_route", [True, False])
def test_index_view_head_values_have_no_surrounding_whitespace(client, publication, on_publication_route):
    """The overridden blocks render inside <title> and meta `content` attributes, so template
    indentation and newlines used to end up inside those values."""
    if on_publication_route:
        url = get_landing_page_path(publication.project_id, publication.version)
    else:
        url = "/published-datasets/"
    body = client.get(url).content.decode()

    values = [re.search(r"<title>(.*?)</title>", body, re.S).group(1)]
    for attr, name in [
        ("name", "robots"),
        ("name", "description"),
        ("property", "og:title"),
        ("property", "og:site_name"),
        ("property", "og:description"),
        ("name", "twitter:card"),
    ]:
        values.append(re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)">', body).group(1))

    for value in values:
        assert value
        assert value == value.strip()
        assert "\n" not in value
    if on_publication_route:
        assert values[:2] == ["Test Dataset | test", "index, follow, max-image-preview:large"]
    else:
        assert values[:2] == ["test Workbench", "noindex, follow"]


def test_index_view_mid_publish_publication_is_noindex_without_metadata(client, publication):
    """Until its files are in place and its DOI is findable, the page's file links and DOI wouldn't
    resolve, so it's served like a withdrawn one: noindex, no JSON-LD or citation tags."""
    publication.is_indexable = False
    publication.save()

    response = client.get(get_landing_page_path(publication.project_id, publication.version))
    body = response.content.decode()

    assert response.status_code == 200
    assert re.search(r'<meta name="robots" content="([^"]*)">', body).group(1) == "noindex, follow"
    assert "application/ld+json" not in body
    assert "citation_title" not in body


@pytest.mark.parametrize("publication_date,expected", [("2024-05-01", ["2024-05-01"]), (None, [])])
def test_index_view_dc_date_only_when_publication_has_a_date(client, settings, publication_date, expected):
    """DC.date is left out, rather than rendered as content="None", for a publication with no date."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    pub = Publication.objects.create(
        project_id="test.project-1",
        value=valid_base_meta(publicationDate=publication_date),
        tree={},
        is_published=True,
    )

    body = client.get(reverse("publications:index", kwargs={"project_id": pub.project_id})).content.decode()

    assert re.findall(r'<meta name="DC.date" content="([^"]*)">', body) == expected
    assert 'name="DC.title"' in body


def test_index_view_fallback_route_is_noindex(client):
    body = client.get("/published-datasets/not-a-real-project/").content.decode()

    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match is not None
    assert robots_match.group(1).strip() == "noindex, follow"
    assert "citation_title" not in body
    assert "application/ld+json" not in body


def test_index_view_renders_og_image_when_cover_image_configured(client, settings, publication):
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "root.system"
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    expected_url = "http://testserver/published-datasets/test.project.published.test.project-1/cover-image"
    assert f'<meta property="og:image" content="{expected_url}">' in body
    assert f'<meta name="twitter:image" content="{expected_url}">' in body
    card_match = re.search(r'<meta name="twitter:card" content="([^"]*)">', body)
    assert card_match is not None
    assert card_match.group(1).strip() == "summary_large_image"


def test_index_view_omits_og_image_without_cover_image_configured(client, publication):
    url = get_landing_page_path(publication.project_id, publication.version)
    body = client.get(url).content.decode()

    assert 'property="og:image"' not in body
    assert 'name="twitter:image"' not in body
    card_match = re.search(r'<meta name="twitter:card" content="([^"]*)">', body)
    assert card_match is not None
    assert card_match.group(1).strip() == "summary"


# ---------------------------------------------------------------------------
# SitemapView
# ---------------------------------------------------------------------------


def test_sitemap_view_served_ahead_of_published_datasets_catch_all(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={})
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


def test_sitemap_view_lists_a_republishs_versioned_url(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(
        project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True, version=2
    )

    body = client.get(reverse("sitemap")).content.decode()

    assert re.findall(r"<loc>(.*?)</loc>", body) == [
        "http://testserver/published-datasets/test.project.published.test.project-1v2"
    ]


def test_sitemap_view_omits_mid_publish_publications(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={})
    Publication.objects.create(project_id="test.project-2", value=valid_base_meta(), tree={}, is_indexable=False)

    body = client.get(reverse("sitemap")).content.decode()

    assert body.count("<url>") == 1
    assert "test.project-1" in body
    assert "test.project-2" not in body


def test_sitemap_view_is_well_formed_sitemap_protocol_xml(client, settings):
    """Parse the body as XML (not substring checks): every <url> has an absolute, same-origin
    <loc> matching the landing page's canonical URL and a W3C-date <lastmod>."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://data.example.org/published-datasets"
    pubs = [
        Publication.objects.create(project_id=f"test.project-{n}", value=valid_base_meta(), tree={}, is_published=True)
        for n in (1, 2)
    ]

    response = client.get(reverse("sitemap"))

    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    root = ElementTree.fromstring(response.content)
    assert root.tag == f"{{{ns['sm']}}}urlset"
    urls = root.findall("sm:url", ns)
    assert len(urls) == len(pubs)
    for url, pub in zip(urls, pubs, strict=True):
        loc = url.findtext("sm:loc", namespaces=ns)
        assert loc == f"https://data.example.org{reverse('publications:index', kwargs={'project_id': pub.project_id})}"
        assert url.findtext("sm:lastmod", namespaces=ns) == pub.last_updated.date().isoformat()
        assert set(child.tag for child in url) == {f"{{{ns['sm']}}}loc", f"{{{ns['sm']}}}lastmod"}


def test_sitemap_view_escapes_xml_special_characters_in_loc(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://a&b.example.org/published-datasets"
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True)

    response = client.get(reverse("sitemap"))

    assert b"a&amp;b.example.org" in response.content
    loc = ElementTree.fromstring(response.content).findtext(
        "sm:url/sm:loc", namespaces={"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    )
    assert loc.startswith("https://a&b.example.org/")


@patch("portal.apps.public_data.sitemap.logger")
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


@pytest.mark.parametrize("url_name,kwargs", [("sitemap", {}), ("sitemap_page", {"page": 1})])
def test_sitemap_view_404s_when_nothing_is_listed(client, url_name, kwargs):
    """The protocol's schema requires at least one <url>, so there's no valid empty sitemap."""
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_indexable=False)

    assert client.get(reverse(url_name, kwargs=kwargs)).status_code == 404


def test_sitemap_view_serves_cached_body_without_rebuilding(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True)
    first = client.get(reverse("sitemap"))
    # Published after the first request: not listed until the cached body expires.
    Publication.objects.create(project_id="test.project-2", value=valid_base_meta(), tree={}, is_published=True)

    with patch("portal.apps.public_data.sitemap.get_citation_context") as mock_get_citation_context:
        second = client.get(reverse("sitemap"))

    mock_get_citation_context.assert_not_called()
    assert second.content == first.content
    assert second["Content-Type"] == "application/xml"
    assert b"test.project-2" not in second.content

    cache.clear()
    assert b"test.project-2" in client.get(reverse("sitemap")).content


def test_sitemap_view_caches_per_origin(client, settings):
    """Each origin's <loc>s are cached separately, so one host's sitemap is never served on another."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True)

    first = client.get(reverse("sitemap"), HTTP_HOST="one.example.org").content
    second = client.get(reverse("sitemap"), HTTP_HOST="two.example.org").content

    assert b"//one.example.org/" in first
    assert b"//two.example.org/" in second
    assert b"one.example.org" not in second


@patch("portal.apps.public_data.views.cache")
def test_sitemap_view_builds_uncached_when_cache_unavailable(mock_cache, client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    mock_cache.get.side_effect = ConnectionError("memcached down")
    mock_cache.set.side_effect = ConnectionError("memcached down")
    Publication.objects.create(project_id="test.project-1", value=valid_base_meta(), tree={}, is_published=True)

    response = client.get(reverse("sitemap"))

    assert response.status_code == 200
    assert b"test.project-1" in response.content


SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def _create_publications(count):
    return [
        Publication.objects.create(project_id=f"test.project-{n}", value=valid_base_meta(), tree={}, is_published=True)
        for n in range(1, count + 1)
    ]


def _sitemap_locs(response):
    root = ElementTree.fromstring(response.content)
    child = "sm:url" if root.tag == f"{{{SITEMAP_NS['sm']}}}urlset" else "sm:sitemap"
    return [element.findtext("sm:loc", namespaces=SITEMAP_NS) for element in root.findall(child, SITEMAP_NS)]


def test_sitemap_page_route_served_ahead_of_published_datasets_catch_all(client):
    assert reverse("sitemap_page", kwargs={"page": 2}) == "/published-datasets/sitemap-2.xml"
    assert resolve("/published-datasets/sitemap-2.xml").url_name == "sitemap_page"


def test_sitemap_view_at_the_limit_is_a_single_urlset(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    _create_publications(2)

    with patch("portal.apps.public_data.sitemap.SITEMAP_MAX_URLS", 2):
        response = client.get(reverse("sitemap"))

    assert ElementTree.fromstring(response.content).tag == f"{{{SITEMAP_NS['sm']}}}urlset"
    assert len(_sitemap_locs(response)) == 2


def test_sitemap_view_past_the_limit_serves_an_index_of_numbered_sitemaps(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://data.example.org/published-datasets"
    pubs = _create_publications(5)

    with patch("portal.apps.public_data.sitemap.SITEMAP_MAX_URLS", 2):
        index = client.get(reverse("sitemap"))
        pages = [client.get(reverse("sitemap_page", kwargs={"page": page})) for page in (1, 2, 3)]

    assert index.status_code == 200
    assert index["Content-Type"] == "application/xml"
    assert ElementTree.fromstring(index.content).tag == f"{{{SITEMAP_NS['sm']}}}sitemapindex"
    assert _sitemap_locs(index) == [f"https://data.example.org/published-datasets/sitemap-{n}.xml" for n in (1, 2, 3)]
    assert all(page["Content-Type"] == "application/xml" for page in pages)
    assert [len(_sitemap_locs(page)) for page in pages] == [2, 2, 1]
    landing_pages = [f"https://data.example.org{get_landing_page_path(pub.project_id, pub.version)}" for pub in pubs]
    assert [loc for page in pages for loc in _sitemap_locs(page)] == landing_pages


def test_sitemap_index_lastmod_is_each_files_newest_lastmod(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    pubs = _create_publications(3)
    # last_updated is auto_now, so it's set with update() rather than save().
    for pub, day in zip(pubs, ("2024-01-05", "2024-03-01", "2023-12-31"), strict=True):
        Publication.objects.filter(pk=pub.pk).update(last_updated=f"{day}T00:00:00Z")

    with patch("portal.apps.public_data.sitemap.SITEMAP_MAX_URLS", 2):
        root = ElementTree.fromstring(client.get(reverse("sitemap")).content)

    lastmods = [
        element.findtext("sm:lastmod", namespaces=SITEMAP_NS) for element in root.findall("sm:sitemap", SITEMAP_NS)
    ]
    assert lastmods == ["2024-03-01", "2023-12-31"]


def test_sitemap_index_escapes_xml_special_characters_in_loc(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://a&b.example.org/published-datasets"
    _create_publications(3)

    with patch("portal.apps.public_data.sitemap.SITEMAP_MAX_URLS", 2):
        response = client.get(reverse("sitemap"))

    assert b"a&amp;b.example.org" in response.content
    assert _sitemap_locs(response)[0] == "https://a&b.example.org/published-datasets/sitemap-1.xml"


@pytest.mark.parametrize("page", [0, 3])
def test_sitemap_page_out_of_range_404s(client, settings, page):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    _create_publications(3)

    with patch("portal.apps.public_data.sitemap.SITEMAP_MAX_URLS", 2):
        assert client.get(reverse("sitemap_page", kwargs={"page": page})).status_code == 404


def test_sitemap_has_no_numbered_pages_under_the_limit(client, settings):
    """Numbered files only exist once sitemap.xml is an index listing them; otherwise
    sitemap-1.xml would be an unlisted duplicate of sitemap.xml."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    _create_publications(2)

    assert client.get(reverse("sitemap")).status_code == 200
    assert client.get(reverse("sitemap_page", kwargs={"page": 1})).status_code == 404


def test_sitemap_index_and_pages_share_one_cached_build(client, settings):
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    _create_publications(3)

    with patch("portal.apps.public_data.sitemap.SITEMAP_MAX_URLS", 2):
        client.get(reverse("sitemap"))
        with patch("portal.apps.public_data.sitemap.get_citation_context") as mock_get_citation_context:
            page = client.get(reverse("sitemap_page", kwargs={"page": 2}))

    mock_get_citation_context.assert_not_called()
    assert len(_sitemap_locs(page)) == 1


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
    landing_page_url = _get_landing_page_url(pub.project_id, pub.version, make_request(RequestFactory()))
    sitemap_locs = re.findall(r"<loc>(.*?)</loc>", client.get(reverse("sitemap")).content.decode())

    assert datacite_url.startswith("https://vanity.example.org/")
    assert datacite_url == landing_page_url
    assert sitemap_locs == [datacite_url]


# ---------------------------------------------------------------------------
# Filenames with characters the file_download route used to reject (newlines)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path",
    ["new\nline.txt", "trailing-newline\n", "dir/sub dir/tab\there.txt", "back\\slash.txt", "plain.csv"],
)
def test_file_download_url_round_trips_any_filename(path):
    """Every legal filename reverses to a URL that resolves back to file_download with the identical
    path. With the old `.+` pattern a newline inside a name made reverse() raise, and a trailing
    newline reversed to a URL that never resolved (a dead contentUrl)."""
    url = reverse("publications:file_download", kwargs={"project_id": "test.project-1", "path": path})

    match = resolve(unquote(url))

    assert match.url_name == "file_download"
    assert match.kwargs == {"project_id": "test.project-1", "path": path}


def test_newline_filename_keeps_landing_page_indexable_with_json_ld(client, settings):
    """Regression: one file whose name contains a newline used to fail the whole page's JSON-LD
    (NoReverseMatch), leaving it noindex with no structured data and out of the sitemap."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    file_objs = [
        {"type": "file", "name": "data.csv", "path": "/data.csv", "sha256": "abc123"},
        {"type": "file", "name": "new\nline.pdf", "path": "/docs/new\nline.pdf", "sha256": "def456"},
    ]
    pub = Publication.objects.create(
        project_id="test.project-2", value=valid_base_meta(fileObjs=file_objs), tree={}, is_published=True
    )

    body = client.get(reverse("publications:index", kwargs={"project_id": pub.project_id})).content.decode()

    robots_match = re.search(r'<meta name="robots" content="([^"]*)">', body)
    assert robots_match.group(1).strip() == "index, follow, max-image-preview:large"
    schema = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', body, re.S).group(1))
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"
    newline_file = schema["distribution"][1]
    assert newline_file["@id"] == newline_file["contentUrl"]
    assert newline_file["contentUrl"].endswith("/files/docs/new%0Aline.pdf")
    # The only PDF is the newline-named one, so it's also citation_pdf_url.
    assert 'name="citation_pdf_url" content="' in body
    assert "test.project-2" in client.get(reverse("sitemap")).content.decode()


def test_newline_filename_download_redirects_to_web_mirror(client, settings):
    """The advertised contentUrl actually serves the file: the request resolves to file_download,
    passes the allow-list, and redirects with the newline percent-encoded (no raw newline in the
    Location header)."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    Publication.objects.create(
        project_id="test.project-1",
        version=1,
        value=valid_base_meta(fileObjs=[{"type": "file", "name": "a\nb.bin", "path": "/dir/a\nb.bin"}]),
        tree={},
    )
    url = reverse("publications:file_download", kwargs={"project_id": "test.project-1", "path": "dir/a\nb.bin"})

    response = client.get(url)

    assert response.status_code == 302
    assert response["Location"] == f"{WEB_BASE_URL}/test.project-1/dir/a%0Ab.bin"


def test_newline_filename_download_streams_from_tapis_without_mirror(client, requests_mock, v1_publication):
    v1_publication.value = valid_base_meta(fileObjs=[{"type": "file", "name": "a\nb.bin", "path": "/a\nb.bin"}])
    v1_publication.save()
    requests_mock.get(f"{TAPIS_CONTENT_URL}/test.project.published.test.project-1/a%0Ab.bin", content=b"bytes")
    url = reverse("publications:file_download", kwargs={"project_id": "test.project-1", "path": "a\nb.bin"})

    response = client.get(url)

    assert response.status_code == 200
    assert b"".join(response.streaming_content) == b"bytes"
    # Django encodes the non-quotable name as filename*= rather than putting a raw newline in a header.
    assert response["Content-Disposition"] == "attachment; filename*=utf-8''a%0Ab.bin"


def test_undeclared_newline_path_is_still_404(client, settings, v1_publication):
    """Accepting newlines in the route doesn't widen what's served: the allow-list still applies."""
    settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL = WEB_BASE_URL
    url = reverse("publications:file_download", kwargs={"project_id": "test.project-1", "path": "data.csv\n"})

    assert client.get(url).status_code == 404


@patch("portal.apps.public_data.links.logger")
def test_unreversible_file_is_skipped_not_fatal(mock_logger, rf, settings, publication):
    """Guard for any future route change: a file whose URL can't be built is omitted -- from
    distribution and as citation_pdf_url -- and logged, instead of failing the page's JSON-LD."""
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    file_objs = [
        {"type": "file", "name": "bad.pdf", "path": "/bad.pdf"},
        {"type": "file", "name": "good.csv", "path": "/good.csv"},
    ]
    real_reverse = reverse

    def reverse_rejecting_bad(viewname, kwargs=None, **extra):
        if kwargs and kwargs.get("path") == "bad.pdf":
            raise NoReverseMatch("simulated")
        return real_reverse(viewname, kwargs=kwargs, **extra)

    request = make_request(rf)
    with patch("portal.apps.public_data.links.reverse", side_effect=reverse_rejecting_bad):
        distribution = _get_distribution(file_objs, "test.project-1", request)
        pdf_url = _get_citation_pdf_url(file_objs, "test.project-1", request)
        assert _get_publication_file_url("test.project-1", "bad.pdf", request) is None

    assert [file_object["@id"] for file_object in distribution] == [f"{FILES_URL}good.csv"]
    assert pdf_url is None
    assert "bad.pdf" in mock_logger.warning.call_args.args[0]


# ---------------------------------------------------------------------------
# Croissant conformance (mlcroissant)
# ---------------------------------------------------------------------------


def test_get_schema_org_json_passes_mlcroissant_validation(rf, settings, publication, tmp_path):
    """The document that claims Croissant 1.1 `conformsTo` validates with mlcroissant, MLCommons'
    reference implementation, with no errors or warnings. mlcroissant is a dev dependency
    (pyproject.toml), so this runs in CI; it's only skipped in an environment synced without the
    dev group.
    """

    mlc = pytest.importorskip("mlcroissant")
    settings.PORTAL_PUBLICATION_PUBLISHER = "Test Publisher"
    publication.value = valid_base_meta(
        fileObjs=[
            {
                "type": "file",
                "name": "data.csv",
                "path": "/data.csv",
                "length": 2048,
                "sha256": "a" * 64,
                "columns": [{"name": "porosity", "dataType": "sc:Float"}, {"name": "sample"}],
            },
            {"type": "file", "name": "scan.raw", "path": "/scans/scan.raw", "length": 123456789, "sha256": "b" * 64},
            {"type": "dir", "name": "raw", "path": "/raw"},
        ]
    )
    publication.save()

    schema = get_schema_org_json(publication, publication.project_id, make_request(rf))
    assert schema["conformsTo"] == "http://mlcommons.org/croissant/1.1"
    assert schema["recordSet"]
    # No ZIP here, so the directory is left out; the archived test above covers FileSets.
    assert not any(_has_type(entry, "cr:FileSet") for entry in schema["distribution"])

    jsonld_path = tmp_path / "croissant.json"
    jsonld_path.write_text(json.dumps(schema))
    # Raises mlcroissant.ValidationError, listing every problem, if the document has errors.
    issues = mlc.Dataset(jsonld=jsonld_path).metadata.ctx.issues
    assert not issues.errors
    assert not issues.warnings
