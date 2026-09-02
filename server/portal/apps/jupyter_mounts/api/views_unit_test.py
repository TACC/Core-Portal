import pytest
import json
import os
from django.conf import settings


@pytest.fixture
def get_user_data(mocker):
    mock = mocker.patch('portal.apps.datafiles.utils.get_user_data')
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


@pytest.fixture
def mock_projects(mocker):
    mock = mocker.patch('portal.apps.jupyter_mounts.api.views.list_projects')
    mock.return_value = [{'id': 'cep-project-1',
                          'path': '/projects/cep.project-1',
                          'name': 'test', 'host': 'cloud.data.tacc.utexas.edu',
                          'updated': '2023-05-09T19:12:12.704162Z',
                          'owner': {'username': 'jarosenb',
                                    'first_name': 'Jake',
                                    'last_name': 'Rosenberg',
                                    'email': 'jrosenberg@tacc.utexas.edu'},
                          'title': 'test',
                          'description': None},
                         {'id': 'cep-project-2',
                          'path': '/projects/cep.project-2',
                          'name': 'CEPV3-DEV-1002', 'host': 'cloud.data.tacc.utexas.edu',
                          'updated': '2023-05-09T19:12:12.704162Z',
                          'owner': {'username': 'jarosenb',
                                    'first_name': 'Jake',
                                    'last_name': 'Rosenberg',
                                    'email': 'jrosenberg@tacc.utexas.edu'},
                          'title': 'test (cep.project-2)',
                          'description': None}]
    yield mock


@pytest.fixture
def mock_project_pems(mocker):
    mock = mocker.patch('portal.apps.jupyter_mounts.api.views.get_workspace_role')
    mock.side_effect = ["OWNER", "GUEST"]
    yield mock


def test_get(authenticated_user, client, mock_projects, mock_project_pems, get_user_data):
    result = client.get('/api/jupyter_mounts/')
    expected = [
        {
            "path": "/path/to/community",
            "mountPath": "/test/Community Data",
            "pems": "ro"
        },
        {
            "path": "/path/to/public",
            "mountPath": "/test/Public Data",
            "pems": "ro"},
        {
            "path": "/home/username",
            "mountPath": "/test/My Data (Work)",
            "pems": "rw"
        },
        {
            "path": "/home1/01234/username",
            "mountPath": "/test/My Data (Frontera)",
            "pems": "rw"
        },
        {
            "path": "/projects/cep.project-1",
            "mountPath": "/test/My Projects/test",
            "pems": "rw"
        },
        {
            "path": "/projects/cep.project-2",
            "mountPath": "/test/My Projects/test (cep.project-2)",
            "pems": "ro"
        }
    ]
    assert json.loads(result.content) == expected
