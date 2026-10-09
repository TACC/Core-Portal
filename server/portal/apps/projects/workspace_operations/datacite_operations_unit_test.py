"""Tests.

.. :module:: portal.apps.projects.workspace_operations.datacite_operations_unit_test
   :synopsis: datacite_operations unit tests.
"""

import datetime
import json
import re

import networkx as nx
import pytest
import requests
from django.test import override_settings
from django.urls import reverse

from portal.apps.projects.workspace_operations.datacite_operations import (
    DATACITE_SCHEMA_VERSION,
    DataCiteError,
    get_datacite_json,
    get_doi_publication_date,
    get_registered_doi_attributes,
    hide_datacite_doi,
    merge_registered_metadata,
    publish_datacite_doi,
    upsert_datacite_json,
)

DATACITE_SETTINGS = override_settings(
    DATACITE_URL="https://api.test.datacite.org",
    DATACITE_USER="datacite-user",
    DATACITE_PASS="datacite-pass",
    PORTAL_PUBLICATION_DATACITE_SHOULDER="10.1234",
)


@pytest.fixture(autouse=True)
def registered_doi(requests_mock):
    """Updates first read what DataCite holds for the DOI (merge_registered_metadata); by default,
    nothing."""
    return requests_mock.get(re.compile(r"https://api\.test\.datacite\.org/dois/.+"), json={"data": {"attributes": {}}})


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
@pytest.mark.parametrize(
    "stored,expected_year",
    [("2019-11-30", 2019), (datetime.datetime(2021, 1, 1, 0, 0), 2021)],
)
def test_get_datacite_json_publication_year_matches_issued_date(stored, expected_year):
    """publicationYear comes from the Issued date, so a republish of an older dataset doesn't claim
    this year."""
    result = get_datacite_json(make_pub_graph(minimal_base_meta(publicationDate=stored)), "test.project-1")
    assert result["publicationYear"] == expected_year
    assert result["dates"][0]["date"].startswith(str(expected_year))


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
def test_get_datacite_json_omits_dates_without_a_publication_date(caplog, stored):
    """With no usable publicationDate in the tree, today's date would overwrite an older DOI's real
    Issued date, so neither it nor publicationYear is sent."""
    result = get_datacite_json(make_pub_graph(minimal_base_meta(publicationDate=stored)), "test.project-1")
    assert "dates" not in result
    assert "publicationYear" not in result
    assert "Publication test.project-1 has no publication date" in caplog.text


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_with_institution_and_authors():
    """The publication-level institution is the HostingInstitution contributor and every creator's
    affiliation, as on main; an author's own institution is ignored."""
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
            "affiliation": [{"name": "Test University"}],
        },
        {
            "name": "Turing, Alan",
            "nameType": "Personal",
            "givenName": "Alan",
            "familyName": "Turing",
            "affiliation": [{"name": "Test University"}],
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
@pytest.mark.parametrize(
    "author,expected",
    [
        ({"first_name": "Ada", "last_name": ""}, {"name": "Ada", "nameType": "Personal", "givenName": "Ada"}),
        (
            {"first_name": None, "last_name": "Lovelace"},
            {"name": "Lovelace", "nameType": "Personal", "familyName": "Lovelace"},
        ),
    ],
)
def test_get_datacite_json_omits_empty_name_parts(author, expected):
    """A missing first or last name is left out rather than sent as an empty string."""
    result = get_datacite_json(make_pub_graph(minimal_base_meta(authors=[author])), "test.project-1")

    assert result["creators"] == [expected]


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_strips_institution_whitespace():
    base_meta = minimal_base_meta(
        institution="  Test University  ",
        authors=[{"first_name": "Ada", "last_name": "Lovelace", "institution": "  Analytical Engine Society  "}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert result["creators"][0]["affiliation"] == [{"name": "Test University"}]
    assert result["contributors"][0]["name"] == "Test University"


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("author_institution", [None, "", "   ", "Analytical Engine Society"])
def test_get_datacite_json_affiliation_is_publication_institution(author_institution):
    """Every author is affiliated with the publication's (stripped) institution, as on main,
    whatever their own institution field holds."""
    author_field = {} if author_institution is None else {"institution": author_institution}
    base_meta = minimal_base_meta(
        institution="  Test University  ",
        authors=[{"first_name": "Ada", "last_name": "Lovelace", **author_field}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")

    assert result["creators"][0]["affiliation"] == [{"name": "Test University"}]


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
@override_settings(PORTAL_PUBLICATION_DATACITE_URL_PREFIX="https://vanity.example.org/published-datasets")
def test_get_datacite_json_url_names_a_republishs_version():
    # A republish's DOI resolves to that version's own `vN` landing page, which the client app
    # needs to load that version's files rather than version 1's.
    result = get_datacite_json(make_pub_graph(minimal_base_meta()), "test.project-1", 2)
    assert result["url"] == "https://vanity.example.org/published-datasets/test.project.published.test.project-1v2"


@pytest.mark.django_db
@override_settings(VANITY_BASE_URL="https://vanity.example.org", PORTAL_PUBLICATION_DATACITE_URL_PREFIX="/just/a/path")
def test_get_datacite_json_url_falls_back_to_vanity_when_prefix_not_absolute():
    result = get_datacite_json(make_pub_graph(minimal_base_meta()), "test.project-1")
    expected_path = reverse("public:index", kwargs={"project_id": "test.project-1"})
    assert result["url"] == f"https://vanity.example.org{expected_path}"


@pytest.mark.django_db
@override_settings(PORTAL_PUBLICATION_DATACITE_URL_PREFIX="https://cep.test/data/tapis/projects/")
@pytest.mark.parametrize("version,suffix", [(None, ""), (1, ""), (3, "v3")])
def test_get_datacite_url_keeps_other_portals_dois_under_their_prefix(version, suffix):
    """A portal whose prefix doesn't point at /published-datasets registers DOIs where it always
    has: the version's published system id under its prefix."""
    result = get_datacite_json(make_pub_graph(minimal_base_meta()), "test.project-1", version)
    assert result["url"] == f"https://cep.test/data/tapis/projects/test.project.published.test.project-1{suffix}"


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
def test_get_datacite_json_rights_list_logs_and_omits_unmapped_label(caplog):
    """Another portal's form may offer a label this one doesn't map, which mustn't block its DOIs."""
    base_meta = minimal_base_meta(license="unmapped-license")
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["rightsList"] == []
    assert "'unmapped-license', which has no license-deed URL" in caplog.text


@override_settings(
    DATACITE_URL="https://api.test.datacite.org",
    DATACITE_USER="datacite-user",
    DATACITE_PASS="datacite-pass",
    PORTAL_PUBLICATION_DATACITE_SHOULDER="10.1234",
    PORTAL_PUBLICATION_LICENSE_URLS={"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/"},
    PORTAL_PUBLICATION_LICENSE_SPDX_IDS={"CC BY 4.0": "CC-BY-4.0"},
)
@pytest.mark.django_db
def test_get_datacite_json_rights_list_resolves_label_from_settings():
    base_meta = minimal_base_meta(license="CC BY 4.0")
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["rightsList"] == [
        {
            "rights": "CC BY 4.0",
            "rightsUri": "https://creativecommons.org/licenses/by/4.0/",
            "rightsIdentifier": "CC-BY-4.0",
            "rightsIdentifierScheme": "SPDX",
            "schemeUri": "https://spdx.org/licenses/",
        }
    ]


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
@pytest.mark.parametrize("blank_link", ["", "   ", None])
def test_get_datacite_json_related_datasets_and_software_skip_blank_links(blank_link):
    """DataCite rejects an empty relatedIdentifier with a 422, so a blank link is never sent."""
    base_meta = minimal_base_meta(
        relatedDatasets=[{"datasetTitle": "D", "datasetDescription": "desc", "datasetLink": blank_link}],
        relatedSoftware=[{"softwareTitle": "S", "softwareDescription": "desc", "softwareLink": blank_link}],
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == []


@DATACITE_SETTINGS
@pytest.mark.django_db
def test_get_datacite_json_related_links_are_trimmed():
    base_meta = minimal_base_meta(
        relatedDatasets=[
            {"datasetTitle": "D", "datasetDescription": "desc", "datasetLink": " https://example.com/dataset "}
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"][0]["relatedIdentifier"] == "https://example.com/dataset"


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


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("blank_link", ["", "   ", None])
def test_get_datacite_json_related_publications_skipped_with_blank_link_and_no_doi(blank_link):
    base_meta = minimal_base_meta(
        relatedPublications=[{"publicationType": "context", "publicationLink": blank_link, "publicationDoi": ""}]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == []


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize("blank_link", ["", None])
def test_get_datacite_json_related_publications_uses_doi_without_link(blank_link):
    base_meta = minimal_base_meta(
        relatedPublications=[
            {"publicationType": "cited_by", "publicationLink": blank_link, "publicationDoi": "10.5555/related-doi"}
        ]
    )
    result = get_datacite_json(make_pub_graph(base_meta), "test.project-1")
    assert result["relatedIdentifiers"] == [
        {"relationType": "IsCitedBy", "relatedIdentifier": "10.5555/related-doi", "relatedIdentifierType": "DOI"}
    ]


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


@DATACITE_SETTINGS
@pytest.mark.django_db
@pytest.mark.parametrize(
    "doi,method,url",
    [
        (None, "POST", "https://api.test.datacite.org/dois"),
        ("10.1234/existing", "PUT", "https://api.test.datacite.org/dois/10.1234/existing"),
    ],
)
def test_datacite_schema_version_is_sent_on_create_and_update(requests_mock, doi, method, url):
    """The payload get_datacite_json builds names the kernel-4 schema, and upsert_datacite_json
    sends it on both a create (POST) and an update (PUT)."""
    getattr(requests_mock, method.lower())(url, json={"data": {"id": doi or "10.1234/newly-minted"}})
    datacite_json = get_datacite_json(make_pub_graph(minimal_base_meta()), "test.project-1")

    upsert_datacite_json(datacite_json, doi=doi)

    request = requests_mock.last_request
    assert (request.method, request.url) == (method, url)
    assert request.json()["data"]["attributes"]["schemaVersion"] == "http://datacite.org/schema/kernel-4"
    assert DATACITE_SCHEMA_VERSION == "http://datacite.org/schema/kernel-4"


@override_settings(
    DATACITE_URL="https://api.test.datacite.org/",
    DATACITE_USER="datacite-user",
    DATACITE_PASS="datacite-pass",
)
def test_upsert_datacite_json_strips_trailing_slash_from_datacite_url(requests_mock):
    requests_mock.post("https://api.test.datacite.org/dois", json={"data": {}})
    upsert_datacite_json({}, doi=None)
    assert requests_mock.last_request.url == "https://api.test.datacite.org/dois"


@DATACITE_SETTINGS
def test_upsert_datacite_json_update_keeps_registered_metadata_the_publication_lacks(requests_mock):
    """A pre-portal DOI's subjects aren't erased by a tree with no keywords."""
    requests_mock.get(DOI_URL, json={"data": {"attributes": {"subjects": [{"subject": "Porous media"}]}}})
    requests_mock.put(DOI_URL, json={"data": {"id": "10.1234/abc"}})

    upsert_datacite_json({"titles": [{"title": "T"}], "subjects": []}, doi="10.1234/abc")

    get_request, put_request = requests_mock.request_history[-2:]
    assert get_request.qs == {"affiliation": ["true"]}
    assert get_request.headers["Authorization"].startswith("Basic ")
    assert "subjects" not in put_request.json()["data"]["attributes"]


@DATACITE_SETTINGS
def test_upsert_datacite_json_create_reads_nothing(requests_mock, registered_doi):
    requests_mock.post("https://api.test.datacite.org/dois", json={"data": {"id": "10.1234/new"}})

    upsert_datacite_json({"titles": [{"title": "T"}]})

    assert not registered_doi.called


@DATACITE_SETTINGS
def test_update_isnt_sent_when_registered_metadata_cant_be_read(requests_mock):
    """Updating blind could erase what the DOI holds, so a failed read fails the update."""
    requests_mock.get(DOI_URL, status_code=503, text="<html>down</html>")
    put = requests_mock.put(DOI_URL, json={"data": {}})

    with pytest.raises(DataCiteError, match="read of 10.1234/abc failed"):
        upsert_datacite_json({"titles": [{"title": "T"}]}, doi="10.1234/abc")
    with pytest.raises(DataCiteError, match="read of 10.1234/abc failed"):
        publish_datacite_doi("10.1234/abc", metadata={"titles": [{"title": "T"}]})
    assert not put.called


@DATACITE_SETTINGS
def test_get_registered_doi_attributes(requests_mock):
    requests_mock.get(DOI_URL, json={"data": {"attributes": {"titles": [{"title": "T"}]}}})

    assert get_registered_doi_attributes("10.1234/abc") == {"titles": [{"title": "T"}]}


# ---------------------------------------------------------------------------
# merge_registered_metadata
# ---------------------------------------------------------------------------

ORCID = {"nameIdentifier": "https://orcid.org/0000-0002-1825-0097", "nameIdentifierScheme": "ORCID"}

# What a pre-portal DOI registered at DataCite looks like: richer than any publication tree.
LEGACY_REGISTERED = {
    "creators": [
        {"name": "Lovelace, Ada", "nameIdentifiers": [ORCID], "affiliation": [{"name": "Own University"}]},
        {"name": "Turing, Alan", "affiliation": [{"name": "Hosting University"}]},
    ],
    "titles": [{"title": "Old title"}, {"title": "A subtitle", "titleType": "Subtitle"}],
    "subjects": [
        {"subject": "free text"},
        {"subject": "Porous materials", "subjectScheme": "LCSH", "schemeUri": "https://id.loc.gov/"},
    ],
    "contributors": [
        {"name": "Hosting University", "contributorType": "HostingInstitution"},
        {"name": "Grace Hopper", "contributorType": "ContactPerson"},
    ],
    "dates": [{"date": "2015", "dateType": "Issued"}, {"date": "2015-06-11", "dateType": "Accepted"}],
    "descriptions": [
        {"description": "Old abstract", "descriptionType": "Abstract"},
        {"description": "How it was measured", "descriptionType": "Methods"},
    ],
    "relatedIdentifiers": [
        {"relatedIdentifier": "10.1/old", "relatedIdentifierType": "DOI", "relationType": "IsCitedBy"},
        {"relatedIdentifier": "10.1/paper", "relatedIdentifierType": "DOI", "relationType": "IsReferencedBy"},
    ],
    "rightsList": [{"rights": "Old license"}],
}


def portal_metadata(**overrides):
    metadata = {
        "creators": [
            {"name": "Lovelace, Ada", "affiliation": [{"name": "Hosting University"}]},
            {"name": "Turing, Alan", "affiliation": [{"name": "Hosting University"}]},
        ],
        "titles": [{"title": "New title"}],
        "subjects": [{"subject": "rocks"}],
        "contributors": [{"name": "Hosting University", "contributorType": "HostingInstitution"}],
        "dates": [{"date": "2015-06-11", "dateType": "Issued"}],
        "descriptions": [{"description": "New abstract", "descriptionType": "Abstract"}],
        "relatedIdentifiers": [
            {"relatedIdentifier": "10.1/new", "relatedIdentifierType": "DOI", "relationType": "IsCitedBy"}
        ],
        "rightsList": [{"rights": "ODC-BY 1.0"}],
        "version": "2",
    }
    metadata.update(overrides)
    return metadata


def test_merge_registered_metadata_portal_values_win_for_what_it_collects():
    merged = merge_registered_metadata(portal_metadata(), LEGACY_REGISTERED)

    assert merged["titles"] == [{"title": "New title"}, {"title": "A subtitle", "titleType": "Subtitle"}]
    assert merged["descriptions"] == [
        {"description": "New abstract", "descriptionType": "Abstract"},
        {"description": "How it was measured", "descriptionType": "Methods"},
    ]
    assert merged["rightsList"] == [{"rights": "ODC-BY 1.0"}]
    assert merged["version"] == "2"


def test_merge_registered_metadata_keeps_entries_of_kinds_the_portal_never_sends():
    merged = merge_registered_metadata(portal_metadata(), LEGACY_REGISTERED)

    # Free-text subjects are the portal's (keywords); a controlled-vocabulary one isn't.
    assert merged["subjects"] == [
        {"subject": "rocks"},
        {"subject": "Porous materials", "subjectScheme": "LCSH", "schemeUri": "https://id.loc.gov/"},
    ]
    assert merged["contributors"] == [
        {"name": "Hosting University", "contributorType": "HostingInstitution"},
        {"name": "Grace Hopper", "contributorType": "ContactPerson"},
    ]
    # The registered Issued date is the DOI's original one, which its publicationYear matches.
    assert merged["dates"] == [
        {"date": "2015", "dateType": "Issued"},
        {"date": "2015-06-11", "dateType": "Accepted"},
    ]
    assert merged["relatedIdentifiers"] == [
        {"relatedIdentifier": "10.1/new", "relatedIdentifierType": "DOI", "relationType": "IsCitedBy"},
        {"relatedIdentifier": "10.1/paper", "relatedIdentifierType": "DOI", "relationType": "IsReferencedBy"},
    ]


def test_merge_registered_metadata_leaves_lists_the_publication_lacks_alone():
    """Not sending a list attribute leaves DataCite's value as it is."""
    merged = merge_registered_metadata(
        portal_metadata(subjects=[], relatedIdentifiers=[], rightsList=[]), LEGACY_REGISTERED
    )

    assert "subjects" not in merged
    assert "relatedIdentifiers" not in merged
    assert "rightsList" not in merged


def test_merge_registered_metadata_keeps_creators_orcid_and_own_affiliation():
    merged = merge_registered_metadata(portal_metadata(), LEGACY_REGISTERED)

    ada, alan = merged["creators"]
    assert ada["nameIdentifiers"] == [ORCID]
    assert ada["affiliation"] == [{"name": "Own University"}]
    # The hosting institution the portal gave every author isn't an affiliation of the author's own.
    assert alan == {"name": "Turing, Alan", "affiliation": [{"name": "Hosting University"}]}


def test_merge_registered_metadata_portal_orcid_wins_and_institution_changes_reach_datacite():
    registered = {
        "creators": [{"name": "Lovelace, Ada", "affiliation": [{"name": "Old Host"}], "nameIdentifiers": [ORCID]}],
        "contributors": [{"name": "Old Host", "contributorType": "HostingInstitution"}],
    }
    new_orcid = {"nameIdentifier": "https://orcid.org/0000-0001-5109-3700", "nameIdentifierScheme": "ORCID"}
    metadata = portal_metadata(
        creators=[{"name": "Lovelace, Ada", "affiliation": [{"name": "New Host"}], "nameIdentifiers": [new_orcid]}],
        contributors=[{"name": "New Host", "contributorType": "HostingInstitution"}],
    )

    (ada,) = merge_registered_metadata(metadata, registered)["creators"]

    assert ada["nameIdentifiers"] == [new_orcid]
    assert ada["affiliation"] == [{"name": "New Host"}]


def test_merge_registered_metadata_matches_creators_by_name_ignoring_case_and_spacing():
    registered = {"creators": [{"name": "lovelace,  ada", "nameIdentifiers": [ORCID]}]}

    (ada, _) = merge_registered_metadata(portal_metadata(), registered)["creators"]

    assert ada["nameIdentifiers"] == [ORCID]


def test_merge_registered_metadata_sends_the_portals_issued_date_when_none_is_registered():
    registered = {"dates": [{"date": "2015-06-11", "dateType": "Accepted"}, {"date": "", "dateType": "Issued"}]}

    merged = merge_registered_metadata(
        portal_metadata(dates=[{"date": "2016-01-02", "dateType": "Issued"}]), registered
    )

    assert merged["dates"] == [
        {"date": "2016-01-02", "dateType": "Issued"},
        {"date": "2015-06-11", "dateType": "Accepted"},
    ]


# Entries a pre-portal DOI (e.g. 10.17612/P7D96T) carries that the schema rejects.
INVALID_CONTRIBUTOR = {"name": "Someone", "contributorType": None}
INVALID_RELATION = {"relatedIdentifier": "", "relatedIdentifierType": "DOI", "relationType": "IsReferencedBy"}


def test_merge_registered_metadata_drops_registered_entries_the_schema_rejects(caplog):
    registered = {
        "contributors": [INVALID_CONTRIBUTOR, {"name": "Grace Hopper", "contributorType": "Researcher"}],
        "relatedIdentifiers": [
            INVALID_RELATION,
            {"relatedIdentifier": "10.1/paper", "relatedIdentifierType": "DOI", "relationType": "IsReferencedBy"},
        ],
    }

    merged = merge_registered_metadata(portal_metadata(), registered)

    assert INVALID_CONTRIBUTOR not in merged["contributors"]
    assert {"name": "Grace Hopper", "contributorType": "Researcher"} in merged["contributors"]
    assert INVALID_RELATION not in merged["relatedIdentifiers"]
    assert {
        "relatedIdentifier": "10.1/paper",
        "relatedIdentifierType": "DOI",
        "relationType": "IsReferencedBy",
    } in merged["relatedIdentifiers"]
    assert "Dropping 1 invalid registered contributors" in caplog.text
    assert "Dropping 1 invalid registered relatedIdentifiers" in caplog.text


def test_merge_registered_metadata_sends_a_cleaned_list_the_publication_lacks():
    """Leaving the list out would leave DataCite's invalid entry in place, so its valid entries
    (or none) are sent instead."""
    kept = {"relatedIdentifier": "10.1/old", "relatedIdentifierType": "DOI", "relationType": "IsCitedBy"}
    registered = {"contributors": [INVALID_CONTRIBUTOR], "relatedIdentifiers": [INVALID_RELATION, kept]}

    merged = merge_registered_metadata(portal_metadata(contributors=[], relatedIdentifiers=[]), registered)

    assert merged["contributors"] == []
    assert merged["relatedIdentifiers"] == [kept]


def test_merge_registered_metadata_with_nothing_registered_sends_the_portals_metadata():
    metadata = portal_metadata()

    assert merge_registered_metadata(metadata, {}) == metadata


def test_merge_registered_metadata_doesnt_change_its_arguments():
    metadata, registered = portal_metadata(), json.loads(json.dumps(LEGACY_REGISTERED))

    merge_registered_metadata(metadata, registered)

    assert metadata == portal_metadata()
    assert registered == LEGACY_REGISTERED


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
def test_publish_datacite_doi_with_url_moves_the_doi_in_the_same_request(requests_mock):
    requests_mock.put("https://api.test.datacite.org/dois/10.1234/abc", json={"data": {}})
    publish_datacite_doi("10.1234/abc", url="https://example.org/published-datasets/p.PRJ-1v2")
    payload = requests_mock.last_request.json()
    assert payload["data"]["attributes"] == {
        "event": "publish",
        "url": "https://example.org/published-datasets/p.PRJ-1v2",
    }


@DATACITE_SETTINGS
def test_publish_datacite_doi_with_metadata_sends_it_with_the_event(requests_mock):
    requests_mock.put("https://api.test.datacite.org/dois/10.1234/abc", json={"data": {}})
    metadata = {
        "titles": [{"title": "v2"}],
        "version": "2",
        "publicationYear": 2026,
        "url": "https://example.org/published-datasets/p.PRJ-1v2",
        "event": "hide",
    }
    publish_datacite_doi("10.1234/abc", metadata=metadata)
    attributes = requests_mock.last_request.json()["data"]["attributes"]
    # An update keeps the year originally registered, and the event is always `publish`.
    assert attributes == {
        "titles": [{"title": "v2"}],
        "version": "2",
        "url": "https://example.org/published-datasets/p.PRJ-1v2",
        "event": "publish",
    }
    assert "publicationYear" in metadata  # the caller's dict isn't changed


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
