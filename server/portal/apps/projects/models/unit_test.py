"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""

from portal.apps.projects.models.metadata import LegacyProjectMetadata
from portal.apps.projects.models.base import Project
from portal.apps.projects.models.utils import get_latest_project_storage
# TODOv3: deprecate with projects
# from portal.libs.agave.models.systems.storage import StorageSystem
import pytest


@pytest.fixture()
def agave_client(mocker):
    yield mocker.patch('portal.apps.auth.models.TapisOAuthToken.client', autospec=True)


@pytest.fixture()
def mock_owner(django_user_model):
    return django_user_model.objects.create_user(username='username',
                                                 password='password')


@pytest.fixture()
def mock_service_account(mocker):
    yield mocker.patch('portal.apps.projects.models.utils.service_account', autospec=True)


def test_create_metadata(mock_owner, mock_project_save_signal):
    project_id = 'PRJ-123'
    defaults = {
        'title': 'Project Title',
        'owner': mock_owner
    }
    (meta, result) = LegacyProjectMetadata.objects.get_or_create(
        project_id=project_id,
        defaults=defaults
    )

    assert meta is not None
    assert meta.project_id == 'PRJ-123'
    assert meta.title == 'Project Title'
    assert meta.owner.username == 'username'
    assert meta.co_pis.count() == 0
    assert meta.team_members.count() == 0


def test_metadata_str(mock_owner, mock_project_save_signal):
    project_id = 'PRJ-123'
    defaults = {
        'title': 'Project Title',
    }
    meta = LegacyProjectMetadata.objects.get_or_create(
        project_id=project_id,
        defaults=defaults
    )
    meta_str = str(meta)
    assert meta_str == '(<ProjectMetadata: PRJ-123 - Project Title>, True)'


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_project_create(mock_owner, portal_project, agave_client, mock_project_save_signal):
    Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert LegacyProjectMetadata.objects.all().count() == 1


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_project_create_dir_failure(mock_owner, portal_project, agave_client, mock_project_save_signal):
    portal_project._create_dir.side_effect = Exception()
    with pytest.raises(Exception):
        Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert LegacyProjectMetadata.objects.all().count() == 0


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_project_create_storage_failure(mock_owner, portal_project, agave_client, mock_project_save_signal):
    portal_project._create_storage.side_effect = Exception()
    with pytest.raises(Exception):
        Project.create(agave_client, "my_project", "mock_project_id", mock_owner)
    assert LegacyProjectMetadata.objects.all().count() == 0


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_metadata_create_on_project_load(agave_client, mock_owner, mock_project_save_signal):
    agave_client.systems.listRoles.return_value = [{'username': 'username', 'role': 'ADMIN'}]
    # TODOv3: deprecate with projects
    # sys = StorageSystem(agave_client, 'cep.test.PRJ-123')
    # sys.last_modified = '1234'
    # sys.description = 'PRJ-123'
    # assert ProjectMetadata.objects.all().count() == 0
    # Project(
    #     agave_client,
    #     'PRJ-123',
    #     storage=sys
    # )
    assert LegacyProjectMetadata.objects.all().count() == 1
    assert LegacyProjectMetadata.objects.last().pi == mock_owner


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_project_change_system_role(agave_client, mock_owner, mock_project_save_signal):
    agave_client.systems.listRoles.return_value = [{'username': 'username', 'role': 'ADMIN'}]
    # TODOv3: deprecate with projects
    # sys = StorageSystem(agave_client, 'cep.test.PRJ-123')
    # sys.last_modified = '1234'
    # sys.description = 'PRJ-123'
    # prj = Project(
    #     agave_client,
    #     'PRJ-123',
    #     storage=sys
    # )
    # prj.change_storage_system_role(mock_owner, 'USER')
    agave_client.systems.updateRole.assert_called_with(
        body={'role': 'USER', 'username': 'username'},
        systemId='cep.test.PRJ-123')


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_project_change_project_role(agave_client, mock_owner, mock_project_save_signal, mocker):
    mock_remove = mocker.patch('portal.apps.projects.models.base.Project.remove_co_pi')
    mock_add = mocker.patch('portal.apps.projects.models.base.Project.add_member')

    # TODOv3: deprecate with projects
    # sys = StorageSystem(agave_client, 'cep.test.PRJ-123')
    # sys.last_modified = '1234'
    # sys.description = 'PRJ-123'

    # prj = Project(
    #     agave_client,
    #     'PRJ-123',
    #     storage=sys
    # )

    # prj.change_project_role(mock_owner, 'co_pi', 'member')
    mock_remove.assert_called_with(mock_owner)
    mock_add.assert_called_with(mock_owner)


@pytest.mark.skip(reason="TODOv3: deprecate with projects")
def test_get_latest_project_storage(mock_owner, portal_project, agave_client, mock_project_save_signal, service_account, mocker, mock_service_account):
    # TODOv3: deprecate with projects
    # sys = StorageSystem(agave_client, 'cep.test.SOME-PRJ-5678')
    # sys.last_modified = '1234'
    # sys.name = 'SOME-PRJ-5678'

    # mock_search = mocker.patch('portal.apps.projects.models.base.StorageSystem.search')
    # mock_search.return_value = [sys]

    # Project(
    #     agave_client,
    #     'SOME-PRJ-5678',
    #     storage=sys
    # )
    latest = get_latest_project_storage()
    assert latest == 5678
