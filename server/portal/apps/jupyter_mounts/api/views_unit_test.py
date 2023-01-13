from mock import MagicMock
import pytest
import json
import os
from django.conf import settings


@pytest.fixture
def get_user_data(mocker):
    mock = mocker.patch('portal.apps.jupyter_mounts.api.views.get_user_data')
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


@pytest.fixture
def mock_projects(mocker):
    mock = mocker.patch('portal.apps.jupyter_mounts.api.views.ProjectsManager')
    project1 = MagicMock()
    project1.description = "test"
    project1.storage = MagicMock(id="cep.project-1")
    project1.absolute_path = "/projects/cep.project-1"
    project1.roles = MagicMock(
        roles=[
            MagicMock(
                role="ADMIN",
                username="username"
            )
        ]
    )
    project2 = MagicMock()
    project2.description = "test"
    project2.storage = MagicMock(id="cep.project-2")
    project2.absolute_path = "/projects/cep.project-2"
    project2.roles = MagicMock(
        roles=[
            MagicMock(
                role="GUEST",
                username="username"
            )
        ]
    )
    mock.return_value.list.return_value = [project1, project2]
    yield mock


def test_get(authenticated_user, client, mock_projects, get_user_data):
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
            "path": "/home/01234/username",
            "mountPath": "/test/My Data (Longhorn)",
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
