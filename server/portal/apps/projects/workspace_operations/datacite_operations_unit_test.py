"""Tests.

.. :module:: portal.apps.projects.workspace_operations.datacite_operations_unit_test
   :synopsis: datacite_operations unit tests.
"""

import datetime

import networkx as nx
import pytest
import requests
from django.test import override_settings
from django.urls import reverse

from portal.apps.projects.workspace_operations.datacite_operations import (
    DataCiteError,
    get_datacite_json,
    get_doi_publication_date,
    hide_datacite_doi,
    publish_datacite_doi,
    upsert_datacite_json,
)

DATACITE_SETTINGS = override_settings(
    DATACITE_URL="https://api.test.datacite.org",
    DATACITE_USER="datacite-user",
    DATACITE_PASS="datacite-pass",
    PORTAL_PUBLICATION_DATACITE_SHOULDER="10.1234",
)


def make_pub_graph(base_meta):
    graph = nx.DiGraph()
    graph.add_node("NODE_ROOT", value=base_meta)
    return graph


def minimal_base_meta(**overrides):
    base_meta = {
        "title": "A Test Dataset",
        "description": "A description of the test dataset.",
        "projectId": "test.project.published.test.project-1",
    }
    base_meta.update(overrides)
    return base_meta


# ---------------------------------------------------------------------------
# get_datacite_json
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_minimal():
    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert "contributors" not in result
    assert result["creators"] == []
    assert result["titles"] == [{"title": "A Test Dataset"}]
    assert result["descriptions"] == [
        {"descriptionType": "Abstract", "description": "A description of the test dataset.", "lang": "en"}
    ]
    assert result["types"] == {"resourceTypeGeneral": "Dataset", "resourceType": "Dataset"}
    assert result["prefix"] == "10.1234"
    assert result["language"] == "en"
    assert result["subjects"] == []
    assert result["rightsList"] == []
    assert "version" not in result
    assert result["identifiers"] == [
        {"identifierType": "Project ID", "identifier": "test.project.published.test.project-1"}
    ]
    assert result["relatedIdentifiers"] == []

    expected_path = reverse("publications:index", kwargs={"project_id": "test.project-1"})
    assert result["url"] == f"https://testserver{expected_path}"


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_publication_year_is_current_year():
    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["publicationYear"] == datetime.datetime.now().year


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize(
    "stored,expected",
    [
        ("2024-05-01", "2024-05-01"),
        ("2024-05-01T12:34:56.789Z", "2024-05-01"),
        (datetime.datetime(2024, 5, 1, 12, 34), "2024-05-01"),
        (datetime.date(2024, 5, 1), "2024-05-01"),
    ],
)
def test_get_datacite_json_issued_date_from_stored_publication_date(stored, expected):
    """A republish (or update_datacite_metadata) keeps the original publication date, whether it's
    still a datetime in memory or has been saved as an ISO string."""
    result = get_datacite_json(make_pub_graph(minimal_base_meta(publicationDate=stored)), "test.project-1")
    assert result["dates"] == [{"date": expected, "dateType": "Issued"}]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_issued_date_reads_snake_case_key():
    result = get_datacite_json(make_pub_graph(minimal_base_meta(publication_date="2023-01-02")), "test.project-1")
    assert result["dates"] == [{"date": "2023-01-02", "dateType": "Issued"}]


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("stored", [None, "", "not a date", 2024])
def test_get_datacite_json_issued_date_defaults_to_today(stored):
    """A first publish has no publicationDate yet (publish_project sets it after minting), so the
    DOI is issued today -- the same "now" publicationYear uses."""
    result = get_datacite_json(make_pub_graph(minimal_base_meta(publicationDate=stored)), "test.project-1")
    assert result["dates"] == [{"date": datetime.date.today().isoformat(), "dateType": "Issued"}]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_with_institution_and_authors():
    """The publication-level institution is the HostingInstitution contributor; each creator's
    affiliation comes only from that author's own institution."""
    base_meta = minimal_base_meta(
        institution="Test University",
        authors=[
            {"first_name": "Ada", "last_name": "Lovelace", "institution": "Analytical Engine Society"},
            {"first_name": "Alan", "last_name": "Turing"},
        ],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert result["contributors"] == [
        {"contributorType": "HostingInstitution", "nameType": "Organizational", "name": "Test University"}
    ]
    assert result["creators"] == [
        {
            "name": "Lovelace, Ada",
            "nameType": "Personal",
            "givenName": "Ada",
            "familyName": "Lovelace",
            "affiliation": [{"name": "Analytical Engine Society"}],
        },
        {
            "name": "Turing, Alan",
            "nameType": "Personal",
            "givenName": "Alan",
            "familyName": "Turing",
        },
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("institution", [None, "", "   "])
def test_get_datacite_json_omits_affiliation_without_institution(institution):
    """The DPMP publish form has no institution field. DataCite rejects a null
    affiliation name, so affiliation is left out instead of sent as {"name": null}."""
    institution_field = {} if institution is None else {"institution": institution}
    base_meta = minimal_base_meta(
        authors=[{"first_name": "Ada", "last_name": "Lovelace", **institution_field}],
        **institution_field,
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert result["creators"] == [
        {"name": "Lovelace, Ada", "nameType": "Personal", "givenName": "Ada", "familyName": "Lovelace"}
    ]
    assert "contributors" not in result


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_strips_institution_whitespace():
    base_meta = minimal_base_meta(
        institution="  Test University  ",
        authors=[{"first_name": "Ada", "last_name": "Lovelace", "institution": "  Analytical Engine Society  "}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert result["creators"][0]["affiliation"] == [{"name": "Analytical Engine Society"}]
    assert result["contributors"][0]["name"] == "Test University"


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize(
    "nameless_author",
    [{}, {"first_name": "", "last_name": ""}, {"first_name": None, "last_name": None}, {"first_name": "  "}],
)
def test_get_datacite_json_leaves_out_author_with_no_name(caplog, nameless_author):
    """DataCite rejects a creator with an empty `name`, so a nameless author is left out (and
    logged) rather than sent."""
    base_meta = minimal_base_meta(authors=[nameless_author, {"first_name": "Ada", "last_name": "Lovelace"}])
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert [creator["name"] for creator in result["creators"]] == ["Lovelace, Ada"]
    assert "Publication test.project-1 has an author with no name" in caplog.text


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize(
    "author,expected_name",
    [({"first_name": "Ada"}, "Ada"), ({"last_name": "Lovelace", "first_name": None}, "Lovelace")],
)
def test_get_datacite_json_keeps_author_with_one_name_part(author, expected_name):
    result = get_datacite_json(make_pub_graph(minimal_base_meta(authors=[author])), "test.project-1")
    assert result["creators"][0]["name"] == expected_name


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_author_with_orcid_adds_name_identifier():
    base_meta = minimal_base_meta(
        authors=[{"first_name": "Ada", "last_name": "Lovelace", "orcid_id": "0000-0002-1825-0097"}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["creators"][0]["nameIdentifiers"] == [
        {
            "nameIdentifier": "https://orcid.org/0000-0002-1825-0097",
            "nameIdentifierScheme": "ORCID",
            "schemeUri": "https://orcid.org",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("orcid_id", [None, "", "   "])
def test_get_datacite_json_author_with_blank_orcid_omits_name_identifiers(orcid_id):
    base_meta = minimal_base_meta(
        authors=[{"first_name": "Ada", "last_name": "Lovelace", "orcid_id": orcid_id}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert "nameIdentifiers" not in result["creators"][0]


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize(
    "orcid_id,expected",
    [
        # A stored URL must not be prefixed a second time.
        ("https://orcid.org/0000-0002-1825-0097", "https://orcid.org/0000-0002-1825-0097"),
        ("0000-0002-9079-593x", "https://orcid.org/0000-0002-9079-593X"),
        ("0000000218250097", "https://orcid.org/0000-0002-1825-0097"),
    ],
)
def test_get_datacite_json_normalizes_orcid_name_identifier(orcid_id, expected):
    base_meta = minimal_base_meta(
        authors=[{"first_name": "Ada", "last_name": "Lovelace", "orcid_id": orcid_id}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["creators"][0]["nameIdentifiers"] == [
        {"nameIdentifier": expected, "nameIdentifierScheme": "ORCID", "schemeUri": "https://orcid.org"}
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("orcid_id", ["not-an-orcid", "0000-0002-1825-0098", "https://example.com/0000-0002-1825-0097"])
def test_get_datacite_json_invalid_orcid_omits_name_identifiers(orcid_id):
    base_meta = minimal_base_meta(
        authors=[{"first_name": "Ada", "last_name": "Lovelace", "orcid_id": orcid_id}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert "nameIdentifiers" not in result["creators"][0]


@pytest.mark.django_db
@override_settings(VANITY_BASE_URL="", PORTAL_PUBLICATION_DATACITE_URL_PREFIX="")
def test_get_datacite_json_raises_without_any_configured_origin():
    base_meta = minimal_base_meta()
    with pytest.raises(ValueError, match="nor VANITY_BASE_URL is configured"):
        get_datacite_json(make_pub_graph(base_meta), "test.project-1")


@pytest.mark.django_db
@override_settings(
    VANITY_BASE_URL="https://prod.internal.example.org",
    PORTAL_PUBLICATION_DATACITE_URL_PREFIX="https://vanity.example.org/published-datasets",
)
def test_get_datacite_json_url_prefers_datacite_url_prefix_origin_over_vanity():
    # DRP prod shape: VANITY_BASE_URL falls back to the internal _WH_BASE_URL host, while the
    # prefix (and so the landing page's canonical/JSON-LD/sitemap URLs) uses the vanity domain.
    result = get_datacite_json(make_pub_graph(minimal_base_meta()), "test.project-1")
    expected_path = reverse("publications:index", kwargs={"project_id": "test.project-1"})
    assert result["url"] == f"https://vanity.example.org{expected_path}"


@pytest.mark.django_db
@override_settings(VANITY_BASE_URL="https://vanity.example.org", PORTAL_PUBLICATION_DATACITE_URL_PREFIX="/just/a/path")
def test_get_datacite_json_url_falls_back_to_vanity_when_prefix_not_absolute():
    result = get_datacite_json(make_pub_graph(minimal_base_meta()), "test.project-1")
    expected_path = reverse("publications:index", kwargs={"project_id": "test.project-1"})
    assert result["url"] == f"https://vanity.example.org{expected_path}"


# ---------------------------------------------------------------------------
# get_datacite_json: subjects
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_subjects_from_comma_separated_string():
    base_meta = minimal_base_meta(keywords="genomics, RNA-seq ,  mouse")
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["subjects"] == [
        {"subject": "genomics"},
        {"subject": "RNA-seq"},
        {"subject": "mouse"},
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_subjects_from_list():
    base_meta = minimal_base_meta(keywords=["genomics", "RNA-seq"])
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["subjects"] == [{"subject": "genomics"}, {"subject": "RNA-seq"}]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_subjects_empty_when_no_keywords():
    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["subjects"] == []


# ---------------------------------------------------------------------------
# get_datacite_json: rightsList
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_rights_list_resolves_known_label():
    base_meta = minimal_base_meta(license="ODC-BY 1.0")
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["rightsList"] == [
        {
            "rights": "ODC-BY 1.0",
            "rightsUri": "https://opendatacommons.org/licenses/by/1-0/",
            "rightsIdentifier": "ODC-By-1.0",
            "rightsIdentifierScheme": "SPDX",
            "schemeUri": "https://spdx.org/licenses/",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_rights_list_adds_spdx_id_for_known_license_url():
    base_meta = minimal_base_meta(license="https://opendatacommons.org/licenses/by/1-0/")
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["rightsList"][0]["rightsIdentifier"] == "ODC-By-1.0"
    assert result["rightsList"][0]["rightsIdentifierScheme"] == "SPDX"


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_rights_list_passes_through_existing_url():
    base_meta = minimal_base_meta(license="https://example.com/license")
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["rightsList"] == [
        {"rights": "https://example.com/license", "rightsUri": "https://example.com/license"}
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_rights_list_empty_when_no_license():
    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["rightsList"] == []


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_rights_list_raises_for_unmapped_label():
    base_meta = minimal_base_meta(license="unmapped-license")
    with pytest.raises(ValueError, match="unmapped-license"):
        get_datacite_json(make_pub_graph(base_meta), "test.project-1")


# ---------------------------------------------------------------------------
# get_datacite_json: version
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_version_included_when_given():
    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1", version=3)
    assert result["version"] == "3"


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_version_omitted_when_not_given():
    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert "version" not in result


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_datasets_included_when_complete():
    base_meta = minimal_base_meta(
        relatedDatasets=[
            {
                "datasetTitle": "Related Dataset",
                "datasetDescription": "desc",
                "datasetLink": "https://example.com/dataset",
            }
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == [
        {
            "relationType": "References",
            "relatedIdentifier": "https://example.com/dataset",
            "relatedIdentifierType": "URL",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_datasets_skipped_when_incomplete():
    base_meta = minimal_base_meta(relatedDatasets=[{"datasetTitle": "Missing fields"}])
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == []


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_software_included_when_complete():
    base_meta = minimal_base_meta(
        relatedSoftware=[
            {
                "softwareTitle": "Related Software",
                "softwareDescription": "desc",
                "softwareLink": "https://example.com/software",
            }
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == [
        {
            "relationType": "References",
            "relatedIdentifier": "https://example.com/software",
            "relatedIdentifierType": "URL",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_software_skipped_when_incomplete():
    base_meta = minimal_base_meta(relatedSoftware=[{"softwareTitle": "Missing fields"}])
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == []


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize(
    ("publication_type", "expected_relation_type"),
    [
        ("linked_dataset", "IsPartOf"),
        ("cited_by", "IsCitedBy"),
        ("context", "IsDocumentedBy"),
        ("unmapped_type", "References"),
        (None, "References"),
    ],
)
def test_get_datacite_json_related_publications_relation_mapping(publication_type, expected_relation_type):
    base_meta = minimal_base_meta(
        relatedPublications=[
            {
                "publicationLink": "https://example.com/publication",
                "publicationType": publication_type,
            }
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == [
        {
            "relationType": expected_relation_type,
            "relatedIdentifier": "https://example.com/publication",
            "relatedIdentifierType": "URL",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_publications_prefers_doi_over_link():
    base_meta = minimal_base_meta(
        relatedPublications=[
            {
                "publicationLink": "https://example.com/publication",
                "publicationType": "context",
                "publicationDoi": "10.5555/related-doi",
            }
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == [
        {
            "relationType": "IsDocumentedBy",
            "relatedIdentifier": "10.5555/related-doi",
            "relatedIdentifierType": "DOI",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("entered_doi", ["https://doi.org/10.5555/related-doi", "doi:10.5555/related-doi"])
def test_get_datacite_json_related_publications_normalizes_doi(entered_doi):
    base_meta = minimal_base_meta(
        relatedPublications=[
            {
                "publicationLink": "https://example.com/publication",
                "publicationType": "context",
                "publicationDoi": entered_doi,
            }
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"][0]["relatedIdentifier"] == "10.5555/related-doi"
    assert result["relatedIdentifiers"][0]["relatedIdentifierType"] == "DOI"


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("blank_doi", ["", None, "not a doi"])
def test_get_datacite_json_related_publications_blank_doi_falls_back_to_link(blank_doi):
    base_meta = minimal_base_meta(
        relatedPublications=[
            {
                "publicationLink": "https://example.com/publication",
                "publicationType": "context",
                "publicationDoi": blank_doi,
            }
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == [
        {
            "relationType": "IsDocumentedBy",
            "relatedIdentifier": "https://example.com/publication",
            "relatedIdentifierType": "URL",
        }
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_publications_skipped_without_link():
    base_meta = minimal_base_meta(relatedPublications=[{"publicationType": "context"}])
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == []


# ---------------------------------------------------------------------------
# upsert_datacite_json
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
def test_upsert_datacite_json_creates_when_no_doi(requests_mock):
    requests_mock.post(
        "https://api.test.datacite.org/dois",
        json={"data": {"id": "10.1234/newly-minted"}},
    )
    datacite_json = {"titles": [{"title": "T"}], "publicationYear": 2024}

    result = upsert_datacite_json(dict(datacite_json), doi=None)

    assert result == {"data": {"id": "10.1234/newly-minted"}}
    assert requests_mock.call_count == 1
    request = requests_mock.last_request
    assert request.method == "POST"
    assert request.url == "https://api.test.datacite.org/dois"
    payload = request.json()
    assert payload["data"]["type"] == "dois"
    assert payload["data"]["relationships"]["client"]["data"]["id"] == "datacite-user"
    assert payload["data"]["attributes"]["publicationYear"] == 2024
    assert request.headers["Content-Type"] == "application/vnd.api+json"
    assert request.headers["Authorization"].startswith("Basic ")


@DATACITE_SETTINGS
def test_upsert_datacite_json_updates_and_strips_publication_year_when_doi_given(requests_mock):
    requests_mock.put(
        "https://api.test.datacite.org/dois/10.1234/existing",
        json={"data": {"id": "10.1234/existing"}},
    )
    datacite_json = {"titles": [{"title": "T"}], "publicationYear": 2024}

    result = upsert_datacite_json(datacite_json, doi="10.1234/existing")

    assert result == {"data": {"id": "10.1234/existing"}}
    request = requests_mock.last_request
    assert request.method == "PUT"
    assert request.url == "https://api.test.datacite.org/dois/10.1234/existing"
    payload = request.json()
    assert "publicationYear" not in payload["data"]["attributes"]
    # The function pops the key from the caller's own dict, not just a copy.
    assert "publicationYear" not in datacite_json


@override_settings(
    DATACITE_URL="https://api.test.datacite.org/",
    DATACITE_USER="datacite-user",
    DATACITE_PASS="datacite-pass",
)
def test_upsert_datacite_json_strips_trailing_slash_from_datacite_url(requests_mock):
    requests_mock.post("https://api.test.datacite.org/dois", json={"data": {}})
    upsert_datacite_json({}, doi=None)
    assert requests_mock.last_request.url == "https://api.test.datacite.org/dois"


# ---------------------------------------------------------------------------
# publish_datacite_doi / hide_datacite_doi
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
def test_publish_datacite_doi(requests_mock):
    requests_mock.put(
        "https://api.test.datacite.org/dois/10.1234/abc",
        json={"data": {"attributes": {"state": "findable"}}},
    )
    result = publish_datacite_doi("10.1234/abc")
    assert result == {"data": {"attributes": {"state": "findable"}}}
    payload = requests_mock.last_request.json()
    assert payload == {"data": {"type": "dois", "attributes": {"event": "publish"}}}


@DATACITE_SETTINGS
def test_hide_datacite_doi(requests_mock):
    requests_mock.put(
        "https://api.test.datacite.org/dois/10.1234/abc",
        json={"data": {"attributes": {"state": "registered"}}},
    )
    result = hide_datacite_doi("10.1234/abc")
    assert result == {"data": {"attributes": {"state": "registered"}}}
    payload = requests_mock.last_request.json()
    assert payload == {"data": {"type": "dois", "attributes": {"event": "hide"}}}


# ---------------------------------------------------------------------------
# DataCite error handling (upsert_datacite_json / publish_datacite_doi / hide_datacite_doi)
# ---------------------------------------------------------------------------

DOI_URL = "https://api.test.datacite.org/dois/10.1234/abc"

# (requests_mock method, URL, call, action named in the error message) for every DataCite write.
DATACITE_CALLS = [
    pytest.param(
        "post",
        "https://api.test.datacite.org/dois",
        lambda: upsert_datacite_json({"titles": [{"title": "T"}]}),
        "DOI creation",
        id="upsert-create",
    ),
    pytest.param(
        "put",
        DOI_URL,
        lambda: upsert_datacite_json({"titles": [{"title": "T"}]}, doi="10.1234/abc"),
        "update of 10.1234/abc",
        id="upsert-update",
    ),
    pytest.param("put", DOI_URL, lambda: publish_datacite_doi("10.1234/abc"), "publish of 10.1234/abc", id="publish"),
    pytest.param("put", DOI_URL, lambda: hide_datacite_doi("10.1234/abc"), "hide of 10.1234/abc", id="hide"),
]

VALIDATION_ERRORS = [
    {"status": "422", "source": "creators", "title": "Creator name is required"},
    {"status": "422", "source": "url", "title": "Url is not in the allowed domains"},
]


@DATACITE_SETTINGS
@pytest.mark.parametrize("method, url, call, action", DATACITE_CALLS)
def test_datacite_call_raises_with_datacite_errors_on_error_status(requests_mock, method, url, call, action):
    """A rejected request (e.g. a 422 when a DOI's metadata fails validation) raises, naming each
    of DataCite's own errors, instead of returning the error body as if it were a success."""
    requests_mock.register_uri(method.upper(), url, status_code=422, json={"errors": VALIDATION_ERRORS})

    with pytest.raises(DataCiteError) as exc_info:
        call()

    assert str(exc_info.value) == (
        f"DataCite {action} failed (HTTP 422): creators: Creator name is required; "
        "url: Url is not in the allowed domains"
    )
    assert exc_info.value.status_code == 422
    assert exc_info.value.errors == VALIDATION_ERRORS


@DATACITE_SETTINGS
@pytest.mark.parametrize("method, url, call, action", DATACITE_CALLS)
def test_datacite_call_raises_on_errors_in_a_2xx_body(requests_mock, method, url, call, action):
    requests_mock.register_uri(method.upper(), url, status_code=200, json={"errors": [{"title": "Not saved"}]})

    with pytest.raises(DataCiteError, match=rf"DataCite {action} failed \(HTTP 200\): Not saved"):
        call()


@DATACITE_SETTINGS
@pytest.mark.parametrize("method, url, call, action", DATACITE_CALLS)
def test_datacite_call_raises_on_error_status_without_errors_array(requests_mock, method, url, call, action):
    requests_mock.register_uri(method.upper(), url, status_code=404, json={"message": "DOI not found"})

    with pytest.raises(DataCiteError) as exc_info:
        call()

    assert str(exc_info.value) == f'DataCite {action} failed (HTTP 404): {{"message": "DOI not found"}}'
    assert exc_info.value.status_code == 404
    assert exc_info.value.errors == []


@DATACITE_SETTINGS
@pytest.mark.parametrize("status_code", [200, 502])
@pytest.mark.parametrize("method, url, call, action", DATACITE_CALLS)
def test_datacite_call_raises_on_non_json_body(requests_mock, method, url, call, action, status_code):
    """E.g. a proxy's HTML error page -- previously res.json() raised an opaque JSONDecodeError."""
    requests_mock.register_uri(method.upper(), url, status_code=status_code, text="<html>Bad Gateway</html>")

    with pytest.raises(DataCiteError) as exc_info:
        call()

    assert str(exc_info.value) == (
        f"DataCite {action} failed (HTTP {status_code}): non-JSON response: '<html>Bad Gateway</html>'"
    )
    assert exc_info.value.status_code == status_code


@DATACITE_SETTINGS
@pytest.mark.parametrize(
    "errors, detail",
    [
        # Not a list: treated as a single error.
        ({"title": "Only one"}, "Only one"),
        # Items with neither `source` nor `title` (or that aren't objects) fall back to their JSON.
        ([{"status": "500"}, "plain string"], '{"status": "500"}; "plain string"'),
    ],
)
def test_datacite_error_detail_tolerates_unexpected_errors_shapes(requests_mock, errors, detail):
    requests_mock.put(DOI_URL, status_code=500, json={"errors": errors})

    with pytest.raises(DataCiteError) as exc_info:
        publish_datacite_doi("10.1234/abc")

    assert str(exc_info.value) == f"DataCite publish of 10.1234/abc failed (HTTP 500): {detail}"


# ---------------------------------------------------------------------------
# get_doi_publication_date
# ---------------------------------------------------------------------------


@DATACITE_SETTINGS
def test_get_doi_publication_date(requests_mock):
    requests_mock.get(
        "https://api.test.datacite.org/dois/10.1234/abc",
        json={"data": {"attributes": {"created": "2024-01-15T00:00:00Z"}}},
    )
    assert get_doi_publication_date("10.1234/abc") == "2024-01-15T00:00:00Z"
    assert requests_mock.last_request.method == "GET"


@DATACITE_SETTINGS
def test_get_doi_publication_date_raises_for_error_status(requests_mock):
    requests_mock.get("https://api.test.datacite.org/dois/10.1234/missing", status_code=404, json={})
    with pytest.raises(requests.exceptions.HTTPError):
        get_doi_publication_date("10.1234/missing")
