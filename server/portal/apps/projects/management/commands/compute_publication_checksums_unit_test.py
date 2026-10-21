from io import StringIO
from types import SimpleNamespace

import pytest
from django.core.management import CommandError, call_command

from portal.apps.projects.workspace_operations.project_publish_operations import (
    load_publication_file_checksums,
    poll_publication_archive_job,
)
from portal.apps.publications.models import Publication

DIR = "portal.apps.projects.management.commands.compute_publication_checksums"

pytestmark = pytest.mark.django_db


@pytest.fixture
def publications():
    Publication.objects.create(project_id="test.project-2", version=1, value={}, tree={})
    Publication.objects.create(project_id="test.project-1", version=3, value={}, tree={})
    Publication.objects.create(project_id="test.project-9", version=1, value={}, tree={}, is_published=False)


@pytest.fixture
def mock_archive(mocker):
    return mocker.patch(
        f"{DIR}.archive_publication_files",
        side_effect=lambda workspace_id, **kw: SimpleNamespace(uuid=f"job-{workspace_id}"),
    )


@pytest.fixture
def mock_poll(mocker):
    return mocker.patch.object(poll_publication_archive_job, "apply_async")


@pytest.fixture
def mock_load(mocker):
    return mocker.patch.object(load_publication_file_checksums, "apply_async")


def run(*args):
    out = StringIO()
    call_command("compute_publication_checksums", *args, stdout=out)
    return out.getvalue()


def test_all_submits_checksum_only_jobs_for_each_versions_workspace(publications, mock_archive, mock_poll, mock_load):
    output = run("--all")

    assert [(c.args, c.kwargs) for c in mock_archive.call_args_list] == [
        (("test.project-1v3",), {"checksum_only": True, "hash_archive": False}),
        (("test.project-2",), {"checksum_only": True, "hash_archive": False}),
    ]
    assert [c.kwargs["args"] for c in mock_poll.call_args_list] == [
        ["job-test.project-1v3", "test.project-1", 3],
        ["job-test.project-2", "test.project-2", 1],
    ]
    mock_load.assert_not_called()
    assert "Submit checksum job for test.project-1 v3" in output


def test_hash_archive_asks_jobs_to_hash_existing_zips(publications, mock_archive, mock_poll, mock_load):
    run("test.project-2", "--hash-archive")

    mock_archive.assert_called_once_with("test.project-2", checksum_only=True, hash_archive=True)


def test_load_only_loads_existing_manifests_without_jobs(publications, mock_archive, mock_poll, mock_load):
    run("test.project-1", "--load-only")

    mock_load.assert_called_once_with(args=["test.project-1", 3])
    mock_archive.assert_not_called()
    mock_poll.assert_not_called()


def test_dry_run_does_nothing(publications, mock_archive, mock_poll, mock_load):
    output = run("--all", "--dry-run")

    mock_archive.assert_not_called()
    mock_poll.assert_not_called()
    mock_load.assert_not_called()
    assert "Would: Submit checksum job for test.project-1 v3" in output


def test_old_archive_app_version_is_a_command_error(publications, mocker, mock_poll):
    """archive_publication_files refuses checksum_only on an app < 0.0.3 (it would re-run the full
    archive); the command surfaces that instead of a traceback, before submitting anything."""
    mocker.patch(f"{DIR}.archive_publication_files", side_effect=ValueError("doesn't support checksumOnly"))

    with pytest.raises(CommandError, match="doesn't support checksumOnly"):
        run("--all")
    mock_poll.assert_not_called()


@pytest.mark.parametrize("project_id", ["test.project-404", "test.project-9"])
def test_unknown_or_unpublished_project_id_errors(publications, mock_archive, project_id):
    with pytest.raises(CommandError, match=project_id):
        run(project_id)
    mock_archive.assert_not_called()


@pytest.mark.parametrize("args", [(), ("test.project-1", "--all")])
def test_requires_exactly_one_of_ids_or_all(publications, mock_archive, args):
    with pytest.raises(CommandError, match="either one or more project ids, or --all"):
        run(*args)
