
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from django.conf import settings
from requests.exceptions import HTTPError
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.accounts.models import SSHKeys, Keys
from mock import MagicMock
import pytest
import json
import os


pytestmark = pytest.mark.django_db

@pytest.fixture
def tas_mock(mocker):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock_get_user_data = mocker.patch('portal.apps.accounts.managers.user_systems.get_user_data')
    mock_get_user_data.return_value = tas_user
    yield mock_get_user_data


@pytest.fixture
def test_manager(tas_mock, regular_user):
    yield UserSystemsManager(regular_user)


@pytest.fixture
def mock_service_account(mocker):
    mock = mocker.patch('portal.apps.accounts.managers.user_systems.service_account')
    # Provide the return_value as a fixture, since the service_account
    # function is always called to create an agave client anyway.
    # Provides syntactic sugar:
    #   mock_service_account.systems.get.return_value = "mock"
    # instead of:
    #   mock_service_account.return_value.systems.get.return_value = "mock"
    yield mock.return_value

def test_init(tas_mock, test_manager, regular_user):
    # Assert that the default system will be loaded
    assert test_manager.system == settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS['frontera']
    assert test_manager.tas_user['username'] == regular_user.username

    # Assert that it loads a system by name
    mgr = UserSystemsManager(regular_user, system_name='longhorn')
    assert mgr.system == settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS['longhorn']


def test_lookup_methods(test_manager):
    assert test_manager.get_name() == 'My Data (Frontera)'
    assert test_manager.get_host() == 'frontera.tacc.utexas.edu'
    assert test_manager.get_system_id() == 'frontera.home.username'
    assert test_manager.get_home_dir() == '/home1'
    assert test_manager.get_abs_home_dir() == '/home1/01234/username'
    assert test_manager.get_rel_home_dir() == 'home_dirs'
    assert test_manager.get_private_directory() == '01234/username'

def test_setup_private_system_exists(test_manager, mock_service_account):
    mock_service_account.systems.get.return_value = "agave.system"
    assert test_manager.setup_private_system() == "agave.system"

def test_setup_private_system(test_manager, mock_service_account, regular_user, mocker, monkeypatch):
    # Mock all the service functions
    mock_error = HTTPError()
    monkeypatch.setattr(mock_error, 'response', MagicMock(status_code=404))
    mock_service_account.systems.get.side_effect = mock_error
    mock_system_definition = MagicMock(id="frontera.home.username")
    mock_get_system_definition = MagicMock(return_value=mock_system_definition)
    monkeypatch.setattr(test_manager, 'get_system_definition', mock_get_system_definition)

    # Run the test
    assert test_manager.setup_private_system() == mock_system_definition
    mock_system_definition.update_role.assert_called_with("username", "OWNER")
    generated_key = SSHKeys.objects.all()[0]
    assert generated_key.user == regular_user
    key_object = Keys.objects.get(ssh_keys=generated_key)
    assert key_object.system == "frontera.home.username"
