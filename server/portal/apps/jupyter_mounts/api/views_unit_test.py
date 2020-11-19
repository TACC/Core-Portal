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
def mock_manager(mocker):
    mock = mocker.patch('portal.apps.jupyter_mounts.api.views.UserSystemsManager')
    mock.return_value.get_sys_tas_user_dir.return_value = "/12345/username"
    mock.return_value.get_name.return_value = "mock_name"
    yield mock


def test_get(authenticated_user, client, service_account, mock_manager):
    result = client.get('/api/jupyter_mounts/')
    expected = [
        {
            "path": "/path/to/community",
            "mountPath": "/test/Community Data",
            "pems": "ro"
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
        }
    ]
    assert json.loads(result.content) == expected
