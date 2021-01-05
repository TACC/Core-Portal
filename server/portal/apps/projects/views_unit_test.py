
import pytest
from portal.apps.projects.managers.base import ProjectsManager
from mock import MagicMock
import json


@pytest.fixture
def mock_project_mgr(mocker):
    mocker.patch('portal.apps.projects.views.ProjectsManager.list')
    mocker.patch('portal.apps.projects.views.ProjectsManager.get_project')
    mocker.patch('portal.apps.projects.views.ProjectsManager.create')
    mocker.patch('portal.apps.projects.views.ProjectsManager.update_prj')
    mocker.patch('portal.apps.projects.views.ProjectsManager.add_member')
    mocker.patch('portal.apps.projects.views.ProjectsManager.remove_member')
    return ProjectsManager


def test_projects_get(regular_user, client, mock_project_mgr):
    mock_project_mgr.list.return_value = {'projectId': 'PRJ-123'}
    client.force_login(regular_user)

    response = client.get('/api/projects/')

    mock_project_mgr.list.assert_called_with(offset=0, limit=100)
    assert response.status_code == 200
    assert response.json() == {
        'status': 200,
        'response': {'projectId': 'PRJ-123'}
    }


def test_projects_post(authenticated_user, client, mock_project_mgr):
    mock_project = MagicMock(storage={'name': 'PRJ-123'})
    mock_project_mgr.create.return_value = mock_project

    response = client.post(
        '/api/projects/',
        {
            'title': 'Test Title',
            'members': [
                {
                    'username': 'username',
                    'access': 'owner'
                }
            ]
        },
        content_type='application/json'
    )

    mock_project_mgr.create.assert_called_with('Test Title')
    mock_project.add_pi.assert_called_with(authenticated_user)
    assert response.status_code == 200
    assert response.json() == {
        'status': 200,
        'response': {'name': 'PRJ-123'}
    }


def test_project_instance_get_by_id(regular_user, client, mock_project_mgr):
    mock_project_mgr.get_project.return_value = MagicMock(metadata={'projectId': 'PRJ-123'})
    client.force_login(regular_user)

    response = client.get('/api/projects/PRJ-123/')

    mock_project_mgr.get_project.assert_called_with('PRJ-123', None)
    assert response.json() == {
        'status': 200,
        'response': {'projectId': 'PRJ-123'}
    }


def test_project_instance_get_by_system(regular_user, client, mock_project_mgr):
    mock_project_mgr.get_project.return_value = MagicMock(metadata={'projectId': 'PRJ-123'})
    client.force_login(regular_user)

    response = client.get('/api/projects/system/cep.project.PRJ-123/')

    mock_project_mgr.get_project.assert_called_with(None, 'cep.project.PRJ-123')
    assert response.json() == {
        'status': 200,
        'response': {'projectId': 'PRJ-123'}
    }


def test_project_instance_patch(regular_user, client, mock_project_mgr):
    mock_project_mgr.update_prj.return_value = MagicMock(metadata={'projectId': 'PRJ-123'})
    client.force_login(regular_user)

    response = client.patch('/api/projects/PRJ-123/', json.dumps({'title': 'New Title'}))

    mock_project_mgr.update_prj.assert_called_with('PRJ-123', None, **{'title': 'New Title'})
    assert response.json() == {
        'status': 200,
        'response': {'projectId': 'PRJ-123'}
    }


def test_members_view_add(regular_user, client, mock_project_mgr):
    mock_project_mgr.add_member.return_value = MagicMock(metadata={'projectId': 'PRJ-123'})
    client.force_login(regular_user)
    patch_body = {'action': 'add_member', 'username': 'test_user'}

    response = client.patch('/api/projects/PRJ-123/members/', json.dumps(patch_body))

    # All new members now have co_pi status since we no longer have distinctions
    # between members and co_pis, and an individual may not become a pi
    # until they have "edit" access (co_pi status)
    mock_project_mgr.add_member.assert_called_with('PRJ-123', 'co_pi', 'test_user')
    assert response.json() == {
        'status': 200,
        'response': {'projectId': 'PRJ-123'}
    }


def test_members_view_remove(regular_user, client, mock_project_mgr):
    mock_project_mgr.remove_member.return_value = MagicMock(metadata={'projectId': 'PRJ-123'})
    client.force_login(regular_user)
    patch_body = {'action': 'remove_member', 'username': 'test_user'}

    response = client.patch('/api/projects/PRJ-123/members/', json.dumps(patch_body))

    mock_project_mgr.remove_member.assert_called_with(project_id='PRJ-123',
                                                      member_type='co_pi',
                                                      username='test_user')
    assert response.json() == {
        'status': 200,
        'response': {'projectId': 'PRJ-123'}
    }
