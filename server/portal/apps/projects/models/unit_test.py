"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""

from portal.apps.projects.models.metadata import ProjectMetadata
from portal.apps.projects.models.base import Project
from portal.libs.agave.models.systems.storage import StorageSystem
import pytest
from mock import MagicMock


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


@pytest.fixture()
def mock_signal(mocker):
    yield mocker.patch('portal.apps.signals.receivers.index_project')


@pytest.fixture()
def mock_system(mocker):
    mocker.patch('portal.libs.agave.models.systems.base.roles')
    yield StorageSystem


def test_create_metadata(mock_owner, mock_signal):
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


def test_metadata_str(mock_owner, mock_signal):
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


def test_project_create(mock_owner, portal_project, agave_client, mock_signal):
    Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert ProjectMetadata.objects.all().count() == 1


def test_project_create_dir_failure(mock_owner, portal_project, agave_client, mock_signal):
    portal_project._create_dir.side_effect = Exception()
    with pytest.raises(Exception):
        Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert ProjectMetadata.objects.all().count() == 0


def test_project_create_storage_failure(mock_owner, portal_project, agave_client, mock_signal):
    portal_project._create_storage.side_effect = Exception()
    with pytest.raises(Exception):
        Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert ProjectMetadata.objects.all().count() == 0


def test_metadata_create_on_project_load(agave_client, mock_owner, mock_signal):
    agave_client.systems.listRoles.return_value = [{'username': 'username', 'role': 'ADMIN'}]
    sys = StorageSystem(agave_client, 'cep.test.PRJ-123')
    sys.last_modified = '1234'
    sys.description = 'PRJ-123'
    assert ProjectMetadata.objects.all().count() == 0
    Project(
        agave_client,
        'PRJ-123',
        storage=sys
    )
    assert ProjectMetadata.objects.all().count() == 1
    assert ProjectMetadata.objects.last().pi == mock_owner
