"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""

from portal.apps.projects.models.metadata import ProjectMetadata
from portal.apps.projects.models.base import Project
import pytest


@pytest.fixture()
def agave_client(mocker):
    yield mocker.patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)


@pytest.fixture()
def portal_project(mocker):
    mocker.patch('portal.apps.projects.models.base.Project._create_dir')
    mocker.patch('portal.apps.projects.models.base.Project._delete_dir')
    mocker.patch('portal.apps.projects.models.base.Project._create_storage')
    yield Project


@pytest.fixture()
def mock_owner(django_user_model):
    return django_user_model.objects.create_user(username='username',
                                                 password='password')


def test_create_metadata_pytest(mock_owner):
    project_id = 'PRJ-123'
    defaults = {
        'title': 'Project Title',
        'owner': mock_owner
    }
    (meta, result) = ProjectMetadata.objects.get_or_create(
        project_id=project_id,
        defaults=defaults
    )

    assert meta is not None
    assert meta.project_id == 'PRJ-123'
    assert meta.title == 'Project Title'
    assert meta.owner.username == 'username'
    assert meta.co_pis.count() == 0
    assert meta.team_members.count() == 0


def test_metadata_str(mock_owner):
    project_id = 'PRJ-123'
    defaults = {
        'title': 'Project Title',
    }
    meta = ProjectMetadata.objects.get_or_create(
        project_id=project_id,
        defaults=defaults
    )
    meta_str = str(meta)
    assert meta_str == '(<ProjectMetadata: PRJ-123 - Project Title>, True)'


def test_project_create(mock_owner, portal_project, agave_client):
    Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert ProjectMetadata.objects.all().count() == 1


def test_project_create_dir_failure(mock_owner, portal_project, agave_client):
    portal_project._create_dir.side_effect = Exception()
    with pytest.raises(Exception):
        Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert ProjectMetadata.objects.all().count() == 0


def test_project_create_storage_failure(mock_owner, portal_project, agave_client):
    portal_project._create_storage.side_effect = Exception()
    with pytest.raises(Exception):
        Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert ProjectMetadata.objects.all().count() == 0
