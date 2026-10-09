import datetime
from io import StringIO

import networkx as nx
import pytest
from django.core.management import CommandError, call_command

from portal.apps.projects.workspace_operations.datacite_operations import DataCiteError
from portal.apps.publications.models import Publication

DIR = "portal.apps.projects.management.commands.update_datacite_metadata"

pytestmark = pytest.mark.django_db


def make_tree(**base_meta):
    graph = nx.DiGraph()
    graph.add_node(
        "NODE_ROOT",
        value={
            "title": "Title",
            "description": "Description",
            "projectId": "test.project.published.test.project-1",
            "authors": [{"first_name": "Ada", "last_name": "Lovelace", "orcid_id": "0000-0002-1825-0097"}],
            "license": "ODC-BY 1.0",
            "keywords": ["rocks"],
            **base_meta,
        },
    )
    return nx.node_link_data(graph)


@pytest.fixture(autouse=True)
def datacite_settings(settings):
    settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX = "https://example.org/published-datasets"
    settings.PORTAL_PUBLICATION_DATACITE_SHOULDER = "10.12345"
    settings.PORTAL_PUBLICATION_PUBLISHER = "Publisher"


@pytest.fixture
def publications():
    Publication.objects.create(project_id="test.project-1", version=2, value={"doi": "10.12345/aaaa"}, tree=make_tree())
    Publication.objects.create(project_id="test.project-2", version=1, value={"doi": "10.12345/bbbb"}, tree=make_tree())
    Publication.objects.create(project_id="test.project-3", version=1, value={}, tree=make_tree())
    Publication.objects.create(
        project_id="test.project-9", version=1, value={"doi": "10.12345/zzzz"}, tree=make_tree(), is_published=False
    )


@pytest.fixture
def mock_upsert(mocker):
    return mocker.patch(f"{DIR}.upsert_datacite_json", side_effect=lambda payload, doi: {"data": {"id": doi}})


def run(*args):
    out, err = StringIO(), StringIO()
    call_command("update_datacite_metadata", *args, stdout=out, stderr=err)
    return out.getvalue(), err.getvalue()


@pytest.mark.parametrize("args", [(), ("test.project-1", "--all")])
def test_requires_ids_or_all(args):
    with pytest.raises(CommandError, match="either"):
        run(*args)


def test_unknown_or_unpublished_id_is_an_error(publications):
    with pytest.raises(CommandError, match="test.project-404, test.project-9"):
        run("test.project-1", "test.project-404", "test.project-9")


def test_all_updates_every_published_doi_and_skips_ones_without_a_doi(publications, mock_upsert):
    out, _ = run("--all")

    assert [call.kwargs["doi"] for call in mock_upsert.call_args_list] == ["10.12345/aaaa", "10.12345/bbbb"]
    assert "Updated 10.12345/aaaa (test.project-1 v2)" in out
    assert "Skipped test.project-3 v1: no DOI" in out
    assert "zzzz" not in out


def test_payload_matches_publish(publications, mock_upsert):
    run("test.project-1")

    payload = mock_upsert.call_args.args[0]
    assert payload["url"] == "https://example.org/published-datasets/test.project.published.test.project-1v2"
    assert payload["version"] == "2"
    assert payload["rightsList"] == [
        {
            "rights": "ODC-BY 1.0",
            "rightsUri": "https://opendatacommons.org/licenses/by/1-0/",
            "rightsIdentifier": "ODC-By-1.0",
            "rightsIdentifierScheme": "SPDX",
            "schemeUri": "https://spdx.org/licenses/",
        }
    ]
    assert payload["subjects"] == [{"subject": "rocks"}]
    assert payload["creators"][0]["name"] == "Lovelace, Ada"
    assert payload["creators"][0]["nameIdentifiers"][0]["nameIdentifier"] == "https://orcid.org/0000-0002-1825-0097"
    assert "publicationYear" not in payload


def test_dry_run_sends_nothing(publications, mock_upsert, mocker):
    mocker.patch(f"{DIR}.get_registered_doi_attributes", return_value={})
    out, _ = run("--all", "--dry-run")

    mock_upsert.assert_not_called()
    assert "Would update 10.12345/aaaa (test.project-1 v2):" in out
    assert '"rightsUri": "https://opendatacommons.org/licenses/by/1-0/"' in out
    assert "publicationYear" not in out


def test_dry_run_prints_the_payload_merged_with_registered_metadata(publications, mock_upsert, mocker):
    """What --dry-run prints is what an update would send, registered metadata included."""
    registered = {"subjects": [{"subject": "Porous materials", "subjectScheme": "LCSH"}]}
    mock_read = mocker.patch(f"{DIR}.get_registered_doi_attributes", return_value=registered)

    out, _ = run("test.project-1", "--dry-run")

    mock_read.assert_called_once_with("10.12345/aaaa")
    assert '"subjectScheme": "LCSH"' in out


def test_dry_run_reports_unreadable_registered_metadata(publications, mock_upsert, mocker):
    mocker.patch(f"{DIR}.get_registered_doi_attributes", side_effect=DataCiteError("DataCite read of x failed"))

    with pytest.raises(CommandError, match="test.project-1"):
        run("test.project-1", "--dry-run")


def test_rejected_update_is_reported_and_the_rest_continue(publications, mocker):
    mock_upsert = mocker.patch(
        f"{DIR}.upsert_datacite_json",
        side_effect=[
            DataCiteError("DataCite update of 10.12345/aaaa failed (HTTP 422): creators: bad", status_code=422),
            {"data": {"id": "10.12345/bbbb"}},
        ],
    )
    out, err = StringIO(), StringIO()

    with pytest.raises(CommandError, match="1 DOI\\(s\\) not updated: test.project-1"):
        call_command("update_datacite_metadata", "--all", stdout=out, stderr=err)

    assert mock_upsert.call_count == 2
    assert "Failed test.project-1 v2 (10.12345/aaaa): DataCite update of" in err.getvalue()
    assert "failed (HTTP 422): creators: bad" in err.getvalue()
    assert "Updated 10.12345/bbbb" in out.getvalue()


def test_request_exception_is_reported(publications, mocker):
    mocker.patch(f"{DIR}.upsert_datacite_json", side_effect=ConnectionError("down"))

    with pytest.raises(CommandError, match="2 DOI\\(s\\) not updated"):
        run("--all")


def test_unbuildable_metadata_is_reported_and_not_sent(publications, mock_upsert):
    Publication.objects.filter(project_id="test.project-1").update(tree=nx.node_link_data(nx.DiGraph()))

    with pytest.raises(CommandError, match="test.project-1"):
        run("--all")

    assert [call.kwargs["doi"] for call in mock_upsert.call_args_list] == ["10.12345/bbbb"]


def test_unmapped_license_is_sent_without_rights_list(publications, mock_upsert):
    Publication.objects.filter(project_id="test.project-1").update(tree=make_tree(license="Unmapped License"))

    run("test.project-1")

    assert mock_upsert.call_args.args[0]["rightsList"] == []


def test_issued_date_falls_back_to_publication_created(publications, mock_upsert):
    """A publication made before its date was stored in the tree keeps its first publish as its
    Issued date, not today's."""
    created = datetime.datetime(2019, 3, 4, 5, 6, tzinfo=datetime.UTC)
    Publication.objects.filter(project_id="test.project-1").update(created=created)

    run("test.project-1")

    assert mock_upsert.call_args.args[0]["dates"] == [{"date": "2019-03-04", "dateType": "Issued"}]


def test_issued_date_prefers_the_stored_publication_date(publications, mock_upsert):
    Publication.objects.filter(project_id="test.project-1").update(
        tree=make_tree(publicationDate="2020-01-02"),
        created=datetime.datetime(2019, 3, 4, tzinfo=datetime.UTC),
    )

    run("test.project-1")

    assert mock_upsert.call_args.args[0]["dates"] == [{"date": "2020-01-02", "dateType": "Issued"}]
