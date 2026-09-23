"""Tests.

.. :module:: portal.apps.projects.workspace_operations.datacite_operations_unit_test
   :synopsis: datacite_operations unit tests.
"""

import networkx as nx
import pytest
import requests
from django.test import override_settings
from django.urls import reverse

from portal.apps.projects.workspace_operations.datacite_operations import (
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
    assert result["types"] == {"resourceTypeGeneral": "Dataset"}
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
    import datetime

    base_meta = minimal_base_meta()
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["publicationYear"] == datetime.datetime.now().year


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_with_institution_and_authors():
    base_meta = minimal_base_meta(
        institution="Test University",
        authors=[
            {"first_name": "Ada", "last_name": "Lovelace", "inst": "Test University"},
            {"first_name": "Alan", "last_name": "Turing", "inst": "Test University"},
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
            "affiliation": [
                {
                    "name": "Test University",
                    "schemeUri": None,
                    "affiliationIdentifier": None,
                    "affiliationIdentifierScheme": None,
                }
            ],
        },
        {
            "name": "Turing, Alan",
            "nameType": "Personal",
            "givenName": "Alan",
            "familyName": "Turing",
            "affiliation": [
                {
                    "name": "Test University",
                    "schemeUri": None,
                    "affiliationIdentifier": None,
                    "affiliationIdentifierScheme": None,
                }
            ],
        },
    ]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_author_missing_name_parts_defaults_to_empty_string():
    base_meta = minimal_base_meta(authors=[{}])
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["creators"][0]["givenName"] == ""
    assert result["creators"][0]["familyName"] == ""
    assert result["creators"][0]["name"] == ""


@pytest.mark.django_db
@override_settings(VANITY_BASE_URL="")
def test_get_datacite_json_raises_without_vanity_base_url():
    base_meta = minimal_base_meta()
    with pytest.raises(ValueError, match="VANITY_BASE_URL is not configured"):
        get_datacite_json(make_pub_graph(base_meta), "test.project-1")


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
        {"rights": "ODC-BY 1.0", "rightsUri": "https://opendatacommons.org/licenses/by/1-0/"}
    ]


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
