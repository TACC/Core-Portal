from mock import MagicMock
import pytest
import json


@pytest.fixture
def service_account(mocker):
    mock = mocker.patch('portal.apps.jupyter_mounts.api.views.service_account')
    mock.return_value.systems.get.return_value = {
        "storage": {
            "rootDir": "/path/to/community"
        }
    }
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


def test_get(authenticated_user, client, service_account, mock_manager, mock_projects):
    result = client.get('/api/jupyter_mounts/')
    expected = [
        {
            "path": "/path/to/community",
            "mountPath": "/test/Community Data",
            "pems": "ro"
        },
        {
            "path": "/path/to/community",
            "mountPath": "/test/Public Data",
            "pems": "ro"},
        {
            "path": "/12345/username",
            "mountPath": "/test/mock_name",
            "pems": "rw"
        },
        {
            "path": "/12345/username",
            "mountPath": "/test/mock_name",
            "pems": "rw"
        },
        {
            "path": "/12345/username",
            "mountPath": "/test/mock_name",
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
