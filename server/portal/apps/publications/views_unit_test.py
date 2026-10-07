"""Tests.

.. :module:: portal.apps.publications.views_unit_test
   :synopsis: publications views unit tests.
"""

import json

import pytest
from django.urls import reverse

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
