from io import StringIO

import networkx as nx
import pytest
from django.core.management import CommandError, call_command

from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.projects.schema_models import constants
from portal.apps.publications.models import Publication

DIR = "portal.apps.projects.management.commands.backfill_project_license"

pytestmark = pytest.mark.django_db


def make_tree(**base_meta):
    graph = nx.DiGraph()
    graph.add_node("NODE_ROOT", value={"title": "Title", **base_meta})
    return nx.node_link_data(graph)


def make_project(system_id, graph=False, **value):
    project = ProjectMetadata.objects.create(name=constants.PROJECT, value={"projectId": system_id, **value})
    if graph:
        ProjectMetadata.objects.create(name=constants.PROJECT_GRAPH, base_project=project, value=make_tree(**value))
    return project


def license_of(project):
    return ProjectMetadata.objects.get(pk=project.pk).value.get("license")


def graph_license_of(project):
    graph = ProjectMetadata.objects.get(name=constants.PROJECT_GRAPH, base_project=project)
    return graph.value["nodes"][0]["value"].get("license")


@pytest.fixture
def publications():
    """test.project-1 (v2) has no license anywhere; test.project-2 is licensed; test.project-3's
    label has no URL; test.project-9 is unpublished."""
    Publication.objects.create(project_id="test.project-1", version=2, value={}, tree=make_tree())
    Publication.objects.create(
        project_id="test.project-2",
        version=1,
        value={"license": "ODC-BY 1.0"},
        tree=make_tree(license="ODC-BY 1.0"),
    )
    Publication.objects.create(
        project_id="test.project-3", version=1, value={"license": "Mystery"}, tree=make_tree(license="Mystery")
    )
    Publication.objects.create(project_id="test.project-9", version=1, value={}, tree=make_tree(), is_published=False)


@pytest.fixture
def projects():
    return {
        "source": make_project("test.project.test.project-1"),
        "published": make_project("test.project.published.test.project-1v2", graph=True),
    }


@pytest.fixture(autouse=True)
def mock_refresh(mocker):
    """Patch the reindex and croissant.json rewrite, which call Elasticsearch and Tapis."""
    return {
        "index": mocker.patch(f"{DIR}.index_publication"),
        "croissant": mocker.patch(f"{DIR}.write_publication_croissant"),
    }


def run(*args):
    out, err = StringIO(), StringIO()
    call_command("backfill_project_license", *args, stdout=out, stderr=err)
    return out.getvalue(), err.getvalue()


@pytest.mark.parametrize("args", [(), ("test.project-1", "--all")])
def test_requires_ids_or_all(args):
    with pytest.raises(CommandError, match="either"):
        run(*args)


def test_unknown_or_unpublished_id_is_an_error(publications):
    with pytest.raises(CommandError, match="test.project-404, test.project-9"):
        run("test.project-1", "test.project-404", "test.project-9")


def test_unmapped_default_license_is_an_error(publications):
    with pytest.raises(CommandError, match="no license-deed URL"):
        run("--all", "--license", "Mystery")


def test_backfills_every_copy_missing_a_license(
    publications, projects, mock_refresh, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        out, err = run("test.project-1")

    publication = Publication.objects.get(project_id="test.project-1")
    assert publication.value["license"] == "ODC-BY 1.0"
    assert publication.tree["nodes"][0]["value"]["license"] == "ODC-BY 1.0"
    assert license_of(projects["source"]) == "ODC-BY 1.0"
    assert license_of(projects["published"]) == "ODC-BY 1.0"
    assert graph_license_of(projects["published"]) == "ODC-BY 1.0"
    assert "Set license 'ODC-BY 1.0' on publication metadata (test.project-1 v2)" in out
    assert "update_datacite_metadata test.project-1" in out
    mock_refresh["index"].assert_called_once_with("test.project-1")
    mock_refresh["croissant"].apply_async.assert_called_once_with(args=["test.project-1", 2])


def test_dry_run_changes_nothing(publications, projects, mock_refresh):
    out, _ = run("--all", "--dry-run")

    assert Publication.objects.get(project_id="test.project-1").value == {}
    assert license_of(projects["source"]) is None
    assert graph_license_of(projects["published"]) is None
    assert "Would set license 'ODC-BY 1.0' on source project (test.project-1 v2)" in out
    assert "1 publication(s) would be updated, 1 with an unmapped license." in out
    mock_refresh["index"].assert_not_called()
    mock_refresh["croissant"].apply_async.assert_not_called()


def test_all_skips_licensed_and_reports_unmapped(publications):
    out, err = run("--all")

    assert "Skipped test.project-2 v1: already has a license" in out
    assert "Skipped test.project-3 v1: its license 'Mystery' has no license-deed URL" in err
    assert Publication.objects.get(project_id="test.project-3").value == {"license": "Mystery"}
    assert Publication.objects.get(project_id="test.project-9").value == {}


def test_prefers_the_existing_license_over_the_default(publications, settings):
    settings.PORTAL_PUBLICATION_LICENSE_URLS = {"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/"}
    Publication.objects.filter(project_id="test.project-1").update(tree=make_tree(license="CC BY 4.0"))
    source = make_project("test.project.test.project-1", license="CC BY 4.0")

    run("test.project-1", "--license", "ODC-BY 1.0")

    assert Publication.objects.get(project_id="test.project-1").value["license"] == "CC BY 4.0"
    assert license_of(source) == "CC BY 4.0"


def test_uses_the_source_projects_license_then_the_given_one(publications, settings):
    settings.PORTAL_PUBLICATION_LICENSE_URLS = {"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/"}
    make_project("test.project.test.project-1", license="CC BY 4.0")

    run("test.project-1", "--license", "ODC-BY 1.0")

    assert Publication.objects.get(project_id="test.project-1").value["license"] == "CC BY 4.0"


def test_given_license_is_used_when_there_is_no_other(publications, settings):
    settings.PORTAL_PUBLICATION_LICENSE_URLS = {"CC BY 4.0": "https://creativecommons.org/licenses/by/4.0/"}

    run("test.project-1", "--license", "CC BY 4.0")

    assert Publication.objects.get(project_id="test.project-1").value["license"] == "CC BY 4.0"


def test_a_failure_is_reported_and_the_rest_still_run(publications, mocker):
    original = Publication.save

    def save(self, *args, **kwargs):
        if self.project_id == "test.project-1":
            raise RuntimeError("boom")
        return original(self, *args, **kwargs)

    mocker.patch.object(Publication, "save", save)
    with pytest.raises(CommandError, match="1 publication\\(s\\) not updated: test.project-1"):
        run("--all")
