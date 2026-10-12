"""Tests.

.. :module:: portal.apps.publications.views_unit_test
   :synopsis: publications views unit tests.
"""

import json
from types import SimpleNamespace

import pytest
from django.urls import reverse

from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.publications.models import Publication

DIR = "portal.apps.publications.views"

pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_version_steps(mocker):
    mocker.patch(f"{DIR}.get_project_for_user")
    return (
        mocker.patch(f"{DIR}.create_publication_workspace"),
        mocker.patch(f"{DIR}.publish_project.apply_async"),
    )


@pytest.mark.parametrize(
    "current_version,workspace_id",
    # Version 1 has no suffix (see publications/utils.py), so the first republish is the first "v" one.
    [(1, "test.project-1v2"), (2, "test.project-1v3")],
)
@pytest.mark.parametrize(
    "full_project_id,is_review",
    [("test.project.test.project-1", False), ("test.project.review.test.project-1", True)],
)
def test_publication_version_view_publishes_next_version_to_its_own_workspace(
    client, authenticated_user, mock_version_steps, current_version, workspace_id, full_project_id, is_review
):
    """A new version gets the workspace id get_published_workspace_id gives it -- the same one
    publish_project and the landing page's file routes derive from Publication.version."""
    mock_create_workspace, mock_publish = mock_version_steps
    Publication.objects.create(project_id="test.project-1", version=current_version, value={}, tree={})

    response = client.post(
        reverse("publications_api:publication_version"),
        data=json.dumps(
            {
                "project_id": full_project_id,
                "is_review_project": is_review,
                "title": "New title",
                "description": "New description",
            }
        ),
        content_type="application/json",
    )

    assert response.status_code == 200
    _, args, _ = mock_create_workspace.mock_calls[0]
    assert args[1:] == (
        "test.project-1",
        "test.project.review.test.project-1",
        workspace_id,
        f"test.project.published.{workspace_id}",
        "New title",
        "New description",
        False,
    )
    mock_publish.assert_called_once_with(kwargs={"project_id": "test.project-1", "version": current_version + 1})


def test_publication_version_view_requires_project_id(client, authenticated_user, mock_version_steps):
    response = client.post(
        reverse("publications_api:publication_version"), data=json.dumps({}), content_type="application/json"
    )

    assert response.status_code == 400
    mock_create_workspace, mock_publish = mock_version_steps
    mock_create_workspace.assert_not_called()
    mock_publish.assert_not_called()


# DPMP's project form: `license` is required.
_LICENSE_REQUIRED_FORMS = {
    "EDIT_PROJECT_ADDON": {"form_fields": [{"name": "license", "type": "select", "validation": {"required": True}}]}
}

# (URL name, request body) for each view that submits, publishes or republishes a project.
_PUBLISH_REQUESTS = [
    ("publication_request", {"project_id": "test.project.test.project-1", "authors": []}),
    ("publication_publish", {"project_id": "test.project.review.test.project-1", "is_review_project": True}),
    ("publication_version", {"project_id": "test.project.review.test.project-1", "is_review_project": True}),
]


@pytest.fixture
def mock_publish_steps(mocker):
    """Mocks everything the three views do around the license check, and returns the mock that
    reads a project's metadata plus the workspace and publish mocks the check has to come before."""
    mocker.patch(f"{DIR}.get_project_for_user")
    mocker.patch(f"{DIR}.copy_graph_and_files_for_review_system.apply_async")
    Publication.objects.create(project_id="test.project-1", version=1, value={}, tree={})
    return (
        mocker.patch(f"{DIR}.ProjectMetadata.get_project_by_id"),
        mocker.patch(f"{DIR}.create_publication_workspace"),
        mocker.patch(f"{DIR}.publish_project.apply_async"),
    )


def _post(client, url_name, body):
    return client.post(reverse(f"publications_api:{url_name}"), data=json.dumps(body), content_type="application/json")


@pytest.mark.parametrize("url_name,body", _PUBLISH_REQUESTS)
@pytest.mark.parametrize("license_value", [None, "", "   "])
def test_publication_views_refuse_a_project_without_a_required_license(
    client, authenticated_user, settings, mock_publish_steps, url_name, body, license_value
):
    """With the portal's form requiring a license, a project without one is refused with a 400 before
    any workspace is created or publish task queued -- the same check the client's publish wizard makes."""
    settings.FORMS = _LICENSE_REQUIRED_FORMS
    mock_get_project, mock_create_workspace, mock_publish = mock_publish_steps
    mock_get_project.return_value = SimpleNamespace(value={"license": license_value})

    response = _post(client, url_name, body)

    assert response.status_code == 400
    assert response.json()["message"] == "License is required"
    # The metadata checked is what gets published: the source project's on submission, the review
    # project's on publish and republish.
    checked_system = (
        "test.project.test.project-1" if url_name == "publication_request" else "test.project.review.test.project-1"
    )
    mock_get_project.assert_called_once_with(checked_system)
    mock_create_workspace.assert_not_called()
    mock_publish.assert_not_called()


@pytest.mark.parametrize("url_name,body", _PUBLISH_REQUESTS)
def test_publication_views_allow_a_project_with_a_required_license(
    client, authenticated_user, settings, mock_publish_steps, url_name, body
):
    settings.FORMS = _LICENSE_REQUIRED_FORMS
    mock_get_project, mock_create_workspace, _ = mock_publish_steps
    mock_get_project.return_value = SimpleNamespace(value={"license": "ODC-BY 1.0"})

    response = _post(client, url_name, body)

    assert response.status_code == 200
    mock_create_workspace.assert_called_once()


@pytest.mark.parametrize("url_name,body", _PUBLISH_REQUESTS)
def test_publication_views_publish_without_a_license_when_the_form_doesnt_require_one(
    client, authenticated_user, settings, mock_publish_steps, url_name, body
):
    """Other portals' forms don't require a license, so they publish without one as before and the
    project isn't read for it."""
    settings.FORMS = {"EDIT_PROJECT_ADDON": {"form_fields": [{"name": "license", "type": "select"}]}}
    mock_get_project, mock_create_workspace, _ = mock_publish_steps
    mock_get_project.return_value = SimpleNamespace(value={})

    response = _post(client, url_name, body)

    assert response.status_code == 200
    mock_create_workspace.assert_called_once()
    if url_name != "publication_request":
        mock_get_project.assert_not_called()


@pytest.mark.parametrize("url_name,body", _PUBLISH_REQUESTS)
def test_publication_views_leave_a_missing_project_to_their_own_handling(
    client, authenticated_user, settings, mock_publish_steps, url_name, body
):
    """The license check doesn't turn a missing project into a "License is required" error."""
    settings.FORMS = _LICENSE_REQUIRED_FORMS
    mock_get_project, mock_create_workspace, _ = mock_publish_steps
    mock_get_project.side_effect = ProjectMetadata.DoesNotExist

    response = _post(client, url_name, body)

    assert response.status_code == 200
    mock_create_workspace.assert_called_once()
