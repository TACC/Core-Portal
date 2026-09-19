"""Tests.

.. :module:: portal.apps.projects.workspace_operations.project_publish_operations_unit_test
   :synopsis: project_publish_operations unit tests.
"""

import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import networkx as nx
import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.projects.schema_models import constants
from portal.apps.projects.workspace_operations.project_publish_operations import (
    _add_values_to_tree,
    _check_transfer_status,
    _transfer_cover_image,
    _transfer_files,
    archive_publication_files,
    copy_graph_and_files_for_review_system,
    get_project_user_emails,
    get_reviewer_emails,
    poll_tapis_file_transfer,
    publication_request_callback,
    publish_project,
    publish_project_callback,
    send_publication_accepted_email_to_authors,
    send_publication_in_review_email_to_authors,
    send_publication_rejected_email_to_authors,
    send_publication_reviewed_email_to_reviewers,
    send_publication_submitted_for_review_email_to_reviewers,
    update_and_cleanup_review_project,
    upload_metadata_file,
)
from portal.apps.publications.models import Publication, PublicationRequest

DIR = "portal.apps.projects.workspace_operations.project_publish_operations"

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def _required_settings(settings):
    # These custom PORTAL_* settings aren't defined anywhere in unit_test_settings.py (it's a
    # standalone settings module, not layered on settings.py's getattr-with-default pattern),
    # so accessing them un-overridden raises AttributeError.
    settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX = "test.project.review"
    settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME = "review.root.system"
    settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME = "publication-reviewers"
    settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME = "published.root.system"
    settings.PORTAL_PUBLICATION_ARCHIVE_APP_ID = "archive-app"
    settings.PORTAL_PUBLICATION_ARCHIVE_APP_VERSION = "1.0"
    settings.PORTAL_PUBLICATION_RANCH_SYSTEM_ID = "ranch-system"
    settings.DEFAULT_FROM_EMAIL = "noreply@test.example"


def make_graph(node_root_value, extra_nodes=None):
    graph = nx.DiGraph()
    graph.add_node("NODE_ROOT", uuid=None, value=node_root_value)
    for node_id, node_attrs in (extra_nodes or {}).items():
        graph.add_node(node_id, **node_attrs)
        graph.add_edge("NODE_ROOT", node_id)
    return graph


def create_project(project_id, value=None):
    value = dict(value or {})
    value.setdefault("projectId", project_id)
    return ProjectMetadata.objects.create(name=constants.PROJECT, value=value)


def create_project_graph(base_project, graph):
    return ProjectMetadata.objects.create(
        name=constants.PROJECT_GRAPH,
        base_project=base_project,
        value=nx.node_link_data(graph),
    )


# ---------------------------------------------------------------------------
# _transfer_files
# ---------------------------------------------------------------------------


def test_transfer_files_filters_trash_and_builds_transfer_elements(mocker, settings):
    mock_service_account = mocker.patch(f"{DIR}.service_account")
    mock_service_client = mock_service_account.return_value
    mock_service_client.files.createTransferTask.return_value = "transfer-result"

    client = MagicMock()
    real_file = SimpleNamespace(name="data.csv", url="tapis://source-sys/data.csv", path="data.csv")
    trash_file = SimpleNamespace(
        name=settings.TAPIS_DEFAULT_TRASH_NAME,
        url=f"tapis://source-sys/{settings.TAPIS_DEFAULT_TRASH_NAME}",
        path=settings.TAPIS_DEFAULT_TRASH_NAME,
    )
    client.files.listFiles.return_value = [real_file, trash_file]

    result = _transfer_files(client, "source-sys", "dest-sys")

    client.files.listFiles.assert_called_once_with(systemId="source-sys", path="/")
    mock_service_client.files.createTransferTask.assert_called_once_with(
        elements=[{"sourceURI": "tapis://source-sys/data.csv", "destinationURI": "tapis://dest-sys/data.csv"}]
    )
    assert result == "transfer-result"


# ---------------------------------------------------------------------------
# _transfer_cover_image
# ---------------------------------------------------------------------------


def test_transfer_cover_image_returns_none_without_path(mocker):
    mock_service_account = mocker.patch(f"{DIR}.service_account")
    assert _transfer_cover_image("source-sys", "dest-sys", None) is None
    mock_service_account.assert_not_called()


def test_transfer_cover_image_builds_transfer_when_path_given(mocker):
    mock_service_account = mocker.patch(f"{DIR}.service_account")
    mock_service_client = mock_service_account.return_value
    mock_transfer = MagicMock()
    mock_service_client.files.createTransferTask.return_value = mock_transfer

    result = _transfer_cover_image("source-sys", "dest-sys", "cover/image.png")

    mock_service_client.files.createTransferTask.assert_called_once_with(
        elements=[
            {
                "sourceURI": "tapis://source-sys/cover/image.png",
                "destinationURI": "tapis://dest-sys/cover/image.png",
            }
        ]
    )
    assert result is mock_transfer


# ---------------------------------------------------------------------------
# _check_transfer_status
# ---------------------------------------------------------------------------


def test_check_transfer_status_returns_status():
    service_client = MagicMock()
    service_client.files.getTransferTask.return_value = SimpleNamespace(status="COMPLETED")
    assert _check_transfer_status(service_client, "transfer-1") == "COMPLETED"
    service_client.files.getTransferTask.assert_called_once_with(transferTaskId="transfer-1")


# ---------------------------------------------------------------------------
# _add_values_to_tree
# ---------------------------------------------------------------------------


def test_add_values_to_tree_embeds_entity_values_and_clears_uuid(mocker):
    project = create_project("test.project-1")
    entity = ProjectMetadata.objects.create(
        name="test.project.file",
        base_project=project,
        value={"path": "data.csv"},
    )
    graph = make_graph({"title": "Project"}, extra_nodes={"NODE_CHILD": {"uuid": entity.uuid, "value": None}})
    create_project_graph(project, graph)
    mocker.patch(f"{DIR}.remove_trash_nodes", side_effect=lambda g: g)

    result = _add_values_to_tree("test.project-1")

    assert result.nodes["NODE_CHILD"]["value"] == {"path": "data.csv"}
    assert result.nodes["NODE_CHILD"]["uuid"] is None
    assert result.nodes["NODE_ROOT"]["value"] == {"title": "Project"}


# ---------------------------------------------------------------------------
# publish_project_callback
# ---------------------------------------------------------------------------


def test_publish_project_callback_orchestrates_cleanup_share_and_archive(mocker):
    mock_service_account = mocker.patch(f"{DIR}.service_account")
    mock_cleanup = mocker.patch(f"{DIR}.update_and_cleanup_review_project")
    mock_archive = mocker.patch(f"{DIR}.archive_publication_files")

    publish_project_callback("review-1", "published-1", "archive-1")

    mock_cleanup.assert_called_once_with("review-1", PublicationRequest.Status.APPROVED)
    mock_service_account.return_value.systems.shareSystemPublic.assert_called_once_with(systemId="published-1")
    mock_archive.assert_called_once_with("archive-1")


# ---------------------------------------------------------------------------
# publication_request_callback
# ---------------------------------------------------------------------------


def test_publication_request_callback_adds_reviewers_and_skips_emails_in_debug(mocker, settings):
    settings.DEBUG = True
    mocker.patch(f"{DIR}.service_account")
    reviewer = get_user_model().objects.create_user(username="reviewer1", email="reviewer1@test.example")
    group = Group.objects.create(name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME)
    reviewer.groups.add(group)

    mock_add_user = mocker.patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.add_user_to_workspace"
    )
    mock_send_in_review = mocker.patch(f"{DIR}.send_publication_in_review_email_to_authors")
    mock_send_submitted = mocker.patch(f"{DIR}.send_publication_submitted_for_review_email_to_reviewers")

    publication_request_callback("token", "source-ws", "review-ws", "source-sys", "review-sys")

    mock_add_user.assert_called_once_with(
        mocker.ANY,
        "review-ws",
        "reviewer1",
        "reader",
        f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.review-ws",
        settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME,
    )
    mock_send_in_review.apply_async.assert_not_called()
    mock_send_submitted.apply_async.assert_not_called()


def test_publication_request_callback_sends_emails_when_not_debug(mocker, settings):
    settings.DEBUG = False
    mocker.patch(f"{DIR}.service_account")
    Group.objects.create(name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME)
    mocker.patch("portal.apps.projects.workspace_operations.shared_workspace_operations.add_user_to_workspace")
    mock_send_in_review = mocker.patch(f"{DIR}.send_publication_in_review_email_to_authors")
    mock_send_submitted = mocker.patch(f"{DIR}.send_publication_submitted_for_review_email_to_reviewers")

    publication_request_callback("token", "source-ws", "review-ws", "source-sys", "review-sys")

    mock_send_in_review.apply_async.assert_called_once_with(args=["source-sys"])
    mock_send_submitted.apply_async.assert_called_once_with(args=["review-sys"])


# ---------------------------------------------------------------------------
# upload_metadata_file
# ---------------------------------------------------------------------------


def test_upload_metadata_file_creates_dir_and_inserts_file(mocker, settings):
    mock_service_account = mocker.patch(f"{DIR}.service_account")
    client = mock_service_account.return_value

    upload_metadata_file("test.project-1", '{"title": "Project"}')

    client.files.mkdir.assert_called_once_with(
        systemId=settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME,
        path="/archive/test.project-1",
    )
    client.files.insert.assert_called_once()
    _, kwargs = client.files.insert.call_args
    assert kwargs["systemId"] == settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    assert kwargs["path"] == "/archive/test.project-1/test.project-1_metadata.json"


# ---------------------------------------------------------------------------
# archive_publication_files
# ---------------------------------------------------------------------------


def test_archive_publication_files_submits_job(mocker, settings):
    mock_service_account = mocker.patch(f"{DIR}.service_account")
    client = mock_service_account.return_value
    client.systems.getSystem.return_value = SimpleNamespace(rootDir="/published/root")
    client.jobs.submitJob.return_value = "job-result"

    result = archive_publication_files("test.project-1")

    assert result == "job-result"
    client.systems.getSystem.assert_called_once_with(systemId=settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME)
    _, kwargs = client.jobs.submitJob.call_args
    assert kwargs["appId"] == settings.PORTAL_PUBLICATION_ARCHIVE_APP_ID
    assert kwargs["appVersion"] == settings.PORTAL_PUBLICATION_ARCHIVE_APP_VERSION
    env_vars = {v["key"]: v["value"] for v in kwargs["parameterSet"]["envVariables"]}
    assert env_vars["publishedRootDir"] == "/published/root"
    assert env_vars["projectId"] == "test.project-1"
    assert env_vars["ranchSystemId"] == settings.PORTAL_PUBLICATION_RANCH_SYSTEM_ID


# ---------------------------------------------------------------------------
# publish_project
# ---------------------------------------------------------------------------


def _setup_publish_project_fixtures(settings, project_id="test.project-1", existing_doi=None):
    settings.DEBUG = True
    review_system_id = f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.{project_id}"
    published_system_id = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{project_id}"
    source_project_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"

    review_project = create_project(review_system_id, value={"title": "Review Project"})
    review_graph = make_graph({"title": "Review Project", "projectId": review_system_id})
    create_project_graph(review_project, review_graph)

    published_project = create_project(published_system_id, value={"title": "Published Project"})

    source_value = {"title": "Source Project", "authors": []}
    if existing_doi:
        source_value["doi"] = existing_doi
    source_project = create_project(source_project_id, value=source_value)

    return SimpleNamespace(
        review_system_id=review_system_id,
        published_system_id=published_system_id,
        source_project_id=source_project_id,
        review_project=review_project,
        published_project=published_project,
        source_project=source_project,
    )


def test_publish_project_success_creates_publication_and_updates_doi(mocker, settings):
    fixtures = _setup_publish_project_fixtures(settings)

    mocker.patch(f"{DIR}.get_datacite_json", return_value={"titles": []})
    mocker.patch(f"{DIR}.upsert_datacite_json", return_value={"data": {"id": "10.5555/minted-doi"}})
    mock_upload_metadata = mocker.patch(f"{DIR}.upload_metadata_file")
    mock_index = mocker.patch(f"{DIR}.index_publication")
    mocker.patch(f"{DIR}.service_account")
    mock_transfer_files = mocker.patch(f"{DIR}._transfer_files")
    mock_transfer_files.return_value = SimpleNamespace(uuid="transfer-uuid-1")
    mocker.patch(f"{DIR}._transfer_cover_image")
    mock_apply_async = mocker.patch.object(poll_tapis_file_transfer, "apply_async")

    publish_project(project_id="test.project-1", version=1)

    source_project = ProjectMetadata.objects.get(pk=fixtures.source_project.pk)
    assert source_project.value["doi"] == "10.5555/minted-doi"
    assert "publicationDate" in source_project.value

    published_project = ProjectMetadata.objects.get(pk=fixtures.published_project.pk)
    assert published_project.value["doi"] == "10.5555/minted-doi"

    publication = Publication.objects.get(project_id="test.project-1")
    assert publication.version == 1
    assert publication.value["doi"] == "10.5555/minted-doi"

    mock_index.assert_called_once_with("test.project-1")
    mock_upload_metadata.assert_called_once()
    mock_apply_async.assert_called_once()
    _, apply_kwargs = mock_apply_async.call_args
    assert apply_kwargs["args"] == ("transfer-uuid-1", False)


def test_publish_project_reuses_existing_doi(mocker, settings):
    _setup_publish_project_fixtures(settings, existing_doi="10.5555/existing-doi")

    mocker.patch(f"{DIR}.get_datacite_json", return_value={"titles": []})
    mock_upsert = mocker.patch(f"{DIR}.upsert_datacite_json", return_value={"data": {"id": "10.5555/existing-doi"}})
    mocker.patch(f"{DIR}.upload_metadata_file")
    mocker.patch(f"{DIR}.index_publication")
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._transfer_files", return_value=SimpleNamespace(uuid="transfer-uuid-2"))
    mocker.patch(f"{DIR}._transfer_cover_image")
    mocker.patch.object(poll_tapis_file_transfer, "apply_async")

    publish_project(project_id="test.project-1", version=1)

    mock_upsert.assert_called_once()
    _, kwargs = mock_upsert.call_args
    assert kwargs["doi"] == "10.5555/existing-doi"


def test_publish_project_datacite_mint_failure_raises_and_rolls_back(mocker, settings):
    fixtures = _setup_publish_project_fixtures(settings)
    mocker.patch(f"{DIR}.get_datacite_json", return_value={"titles": []})
    mocker.patch(f"{DIR}.upsert_datacite_json", side_effect=RuntimeError("datacite unavailable"))
    mocker.patch(f"{DIR}.service_account")

    with pytest.raises(Exception, match="Error minting DOI for project test.project-1"):
        publish_project(project_id="test.project-1", version=1)

    source_project = ProjectMetadata.objects.get(pk=fixtures.source_project.pk)
    assert "doi" not in source_project.value
    assert not Publication.objects.filter(project_id="test.project-1").exists()


def test_publish_project_debug_false_publishes_doi_and_schedules_emails(mocker, settings):
    _setup_publish_project_fixtures(settings)
    settings.DEBUG = False

    mocker.patch(f"{DIR}.get_datacite_json", return_value={"titles": []})
    mocker.patch(f"{DIR}.upsert_datacite_json", return_value={"data": {"id": "10.5555/minted-doi"}})
    mock_publish_doi = mocker.patch(f"{DIR}.publish_datacite_doi")
    mocker.patch(f"{DIR}.upload_metadata_file")
    mocker.patch(f"{DIR}.index_publication")
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._transfer_files", return_value=SimpleNamespace(uuid="transfer-uuid-3"))
    mocker.patch(f"{DIR}._transfer_cover_image")
    mocker.patch.object(poll_tapis_file_transfer, "apply_async")
    mock_accepted = mocker.patch(f"{DIR}.send_publication_accepted_email_to_authors")
    mock_reviewed = mocker.patch(f"{DIR}.send_publication_reviewed_email_to_reviewers")

    publish_project(project_id="test.project-1", version=1)

    mock_publish_doi.assert_called_once_with("10.5555/minted-doi")
    mock_accepted.apply_async.assert_called_once_with(args=["test.project-1"])
    mock_reviewed.apply_async.assert_called_once_with(args=["test.project-1", "APPROVED", None])


def test_publish_project_datacite_publish_failure_raises(mocker, settings):
    _setup_publish_project_fixtures(settings)
    settings.DEBUG = False

    mocker.patch(f"{DIR}.get_datacite_json", return_value={"titles": []})
    mocker.patch(f"{DIR}.upsert_datacite_json", return_value={"data": {"id": "10.5555/minted-doi"}})
    mocker.patch(f"{DIR}.publish_datacite_doi", side_effect=RuntimeError("datacite down"))
    mocker.patch(f"{DIR}.service_account")

    with pytest.raises(Exception, match="Error publishing DOI for project test.project-1"):
        publish_project(project_id="test.project-1", version=1)


def test_publish_project_graph_property_write_is_not_persisted(mocker, settings):
    """Documents observed (not fixed) behavior: `published_project.project_graph.value = ...`
    (project_publish_operations.py, publish_project) assigns to a fresh, never-saved instance
    returned by the `project_graph` property, so it has no persisted effect -- only
    `Publication.tree` (set explicitly via update_or_create) actually ends up with the
    doi/version/publicationDate written into it.
    """
    fixtures = _setup_publish_project_fixtures(settings)

    mocker.patch(f"{DIR}.get_datacite_json", return_value={"titles": []})
    mocker.patch(f"{DIR}.upsert_datacite_json", return_value={"data": {"id": "10.5555/minted-doi"}})
    mocker.patch(f"{DIR}.upload_metadata_file")
    mocker.patch(f"{DIR}.index_publication")
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._transfer_files", return_value=SimpleNamespace(uuid="transfer-uuid-4"))
    mocker.patch(f"{DIR}._transfer_cover_image")
    mocker.patch.object(poll_tapis_file_transfer, "apply_async")

    publish_project(project_id="test.project-1", version=1)

    persisted_graph = ProjectMetadata.objects.get(name=constants.PROJECT_GRAPH, base_project=fixtures.published_project)
    assert "doi" not in json.dumps(persisted_graph.value)

    publication = Publication.objects.get(project_id="test.project-1")
    assert "10.5555/minted-doi" in json.dumps(publication.tree)


# ---------------------------------------------------------------------------
# copy_graph_and_files_for_review_system
# ---------------------------------------------------------------------------


def test_copy_graph_and_files_for_review_system(mocker):
    review_project = create_project("test.project.review.test.project-2", value={"title": "Review"})
    mocker.patch(f"{DIR}._add_values_to_tree", return_value=make_graph({"title": "Source"}))
    mock_user_account = mocker.patch(f"{DIR}.user_account")
    mock_transfer_files = mocker.patch(f"{DIR}._transfer_files", return_value=SimpleNamespace(uuid="transfer-uuid-5"))
    mock_transfer_cover = mocker.patch(f"{DIR}._transfer_cover_image")
    mock_apply_async = mocker.patch.object(poll_tapis_file_transfer, "apply_async")

    copy_graph_and_files_for_review_system(
        "user-token", "source-ws", "review-ws", "source-sys", "test.project.review.test.project-2"
    )

    graph_row = ProjectMetadata.objects.get(name=constants.PROJECT_GRAPH, base_project=review_project)
    assert graph_row.value["nodes"][0]["value"]["projectId"] == "test.project.review.test.project-2"

    mock_user_account.assert_called_once_with("user-token")
    mock_transfer_files.assert_called_once_with(
        mock_user_account.return_value, "source-sys", "test.project.review.test.project-2"
    )
    mock_transfer_cover.assert_called_once()
    mock_apply_async.assert_called_once()
    _, apply_kwargs = mock_apply_async.call_args
    assert apply_kwargs["args"] == ("transfer-uuid-5", True)


# ---------------------------------------------------------------------------
# poll_tapis_file_transfer
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("status", ["PENDING", "IN_PROGRESS"])
def test_poll_tapis_file_transfer_retries_while_pending(mocker, status):
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._check_transfer_status", return_value=status)
    mock_apply_async = mocker.patch.object(poll_tapis_file_transfer, "apply_async")

    poll_tapis_file_transfer(transfer_task_id="transfer-1", is_review=True)

    mock_apply_async.assert_called_once_with(args=("transfer-1", True), kwargs={}, countdown=30)


def test_poll_tapis_file_transfer_completed_review_dispatches_publication_request_callback(mocker):
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._check_transfer_status", return_value="COMPLETED")
    mock_callback = mocker.patch(f"{DIR}.publication_request_callback")

    poll_tapis_file_transfer(transfer_task_id="transfer-1", is_review=True, foo="bar")

    mock_callback.assert_called_once_with(foo="bar")


def test_poll_tapis_file_transfer_completed_not_review_dispatches_publish_project_callback(mocker):
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._check_transfer_status", return_value="COMPLETED")
    mock_callback = mocker.patch(f"{DIR}.publish_project_callback")

    poll_tapis_file_transfer(transfer_task_id="transfer-1", is_review=False, baz="qux")

    mock_callback.assert_called_once_with(baz="qux")


def test_poll_tapis_file_transfer_failed_status_triggers_retry(mocker):
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._check_transfer_status", return_value="FAILED")
    mock_retry = mocker.patch.object(poll_tapis_file_transfer, "retry")

    poll_tapis_file_transfer(transfer_task_id="transfer-1", is_review=False)

    mock_retry.assert_called_once()
    _, kwargs = mock_retry.call_args
    assert kwargs["countdown"] == 30
    assert isinstance(kwargs["exc"], Exception)


def test_poll_tapis_file_transfer_callback_exception_triggers_retry(mocker):
    mocker.patch(f"{DIR}.service_account")
    mocker.patch(f"{DIR}._check_transfer_status", return_value="COMPLETED")
    mocker.patch(f"{DIR}.publish_project_callback", side_effect=RuntimeError("callback boom"))
    mock_retry = mocker.patch.object(poll_tapis_file_transfer, "retry")

    poll_tapis_file_transfer(transfer_task_id="transfer-1", is_review=False)

    mock_retry.assert_called_once()


# ---------------------------------------------------------------------------
# update_and_cleanup_review_project
# ---------------------------------------------------------------------------


def test_update_and_cleanup_review_project_removes_reviewers_and_deletes_project(mocker, settings):
    review_project = create_project("test.project.review.test.project-3", value={"title": "Review"})
    source_project = create_project("test.project.test.project-3", value={"title": "Source"})
    create_project_graph(review_project, make_graph({"title": "Review"}))

    reviewer1 = get_user_model().objects.create_user(username="reviewer1")
    reviewer2 = get_user_model().objects.create_user(username="reviewer2")
    pub_request = PublicationRequest.objects.create(
        review_project=review_project,
        source_project=source_project,
        status=PublicationRequest.Status.PENDING,
    )
    pub_request.reviewers.set([reviewer1, reviewer2])

    mock_client = mocker.patch(f"{DIR}.service_account").return_value
    mock_remove_user = mocker.patch(f"{DIR}.remove_user", side_effect=[Exception("boom"), None])

    update_and_cleanup_review_project("test.project.review.test.project-3", PublicationRequest.Status.APPROVED)

    assert mock_remove_user.call_count == 2
    mock_client.files.delete.assert_called_once_with(systemId="test.project.review.test.project-3", path="/")
    mock_client.systems.deleteSystem.assert_called_once_with(systemId="test.project.review.test.project-3")

    pub_request.refresh_from_db()
    assert pub_request.status == PublicationRequest.Status.APPROVED
    assert not ProjectMetadata.objects.filter(pk=review_project.pk).exists()
    assert not ProjectMetadata.objects.filter(name=constants.PROJECT_GRAPH, base_project_id=review_project.pk).exists()


# ---------------------------------------------------------------------------
# get_project_user_emails / get_reviewer_emails
# ---------------------------------------------------------------------------


def test_get_project_user_emails_filters_out_missing_emails():
    create_project(
        "test.project-4",
        value={
            "title": "Project",
            "authors": [
                {"email": "a@test.example"},
                {"email": ""},
                {"first_name": "No Email"},
                {"email": "b@test.example"},
            ],
        },
    )
    assert get_project_user_emails("test.project-4") == ["a@test.example", "b@test.example"]


def test_get_reviewer_emails_filters_out_missing_emails(settings):
    group = Group.objects.create(name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME)
    with_email = get_user_model().objects.create_user(username="rev1", email="rev1@test.example")
    without_email = get_user_model().objects.create_user(username="rev2", email="")
    with_email.groups.add(group)
    without_email.groups.add(group)
    not_a_reviewer = get_user_model().objects.create_user(username="rev3", email="rev3@test.example")

    emails = get_reviewer_emails()

    assert emails == ["rev1@test.example"]
    assert not_a_reviewer.email not in emails


# ---------------------------------------------------------------------------
# Email tasks (smoke coverage)
# ---------------------------------------------------------------------------


def test_send_publication_accepted_email_to_authors(mocker):
    mocker.patch(f"{DIR}.get_project_user_emails", return_value=["a@test.example", "b@test.example"])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_accepted_email_to_authors("test.project-1")

    assert mock_send_mail.call_count == 2
    recipients = [call.args[3] for call in mock_send_mail.call_args_list]
    assert recipients == [["a@test.example"], ["b@test.example"]]


def test_send_publication_accepted_email_to_authors_no_recipients(mocker):
    mocker.patch(f"{DIR}.get_project_user_emails", return_value=[])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_accepted_email_to_authors("test.project-1")

    mock_send_mail.assert_not_called()


def test_send_publication_rejected_email_to_authors(mocker):
    mocker.patch(f"{DIR}.get_project_user_emails", return_value=["a@test.example"])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_rejected_email_to_authors("test.project-1")

    mock_send_mail.assert_called_once()
    assert mock_send_mail.call_args.args[3] == ["a@test.example"]


def test_send_publication_in_review_email_to_authors(mocker):
    mocker.patch(f"{DIR}.get_project_user_emails", return_value=["a@test.example"])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_in_review_email_to_authors("test.project-1")

    mock_send_mail.assert_called_once()
    assert mock_send_mail.call_args.args[3] == ["a@test.example"]


@pytest.mark.parametrize(
    ("status", "expected_subject_fragment"),
    [
        (PublicationRequest.Status.APPROVED, "Alert: A Dataset has Received Review"),
        (PublicationRequest.Status.REJECTED, "Alert: A Dataset has Received Review"),
    ],
)
def test_send_publication_reviewed_email_to_reviewers(mocker, status, expected_subject_fragment):
    mocker.patch(f"{DIR}.get_reviewer_emails", return_value=["rev@test.example"])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_reviewed_email_to_reviewers("test.project-1", status, "reviewer1")

    mock_send_mail.assert_called_once()
    assert expected_subject_fragment in mock_send_mail.call_args.args[0]
    assert mock_send_mail.call_args.args[3] == ["rev@test.example"]


def test_send_publication_submitted_for_review_email_to_reviewers(mocker):
    mocker.patch(f"{DIR}.get_reviewer_emails", return_value=["rev@test.example"])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_submitted_for_review_email_to_reviewers("test.project-1")

    mock_send_mail.assert_called_once()
    assert mock_send_mail.call_args.args[3] == ["rev@test.example"]


def test_send_publication_submitted_for_review_email_to_reviewers_no_recipients(mocker):
    mocker.patch(f"{DIR}.get_reviewer_emails", return_value=[])
    mock_send_mail = mocker.patch(f"{DIR}.send_mail")

    send_publication_submitted_for_review_email_to_reviewers("test.project-1")

    mock_send_mail.assert_not_called()
