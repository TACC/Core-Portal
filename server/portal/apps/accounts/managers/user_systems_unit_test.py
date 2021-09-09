
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from django.conf import settings
from requests.exceptions import HTTPError
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.accounts.models import SSHKeys, Keys, HostKeys
from mock import MagicMock
import pytest
import json
import os

pytestmark = pytest.mark.django_db


@pytest.fixture
def tas_mock(mocker):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user_with_underscore.json')) as f:
        tas_user = json.load(f)
    mock_get_user_data = mocker.patch('portal.apps.accounts.managers.user_systems.get_user_data')
    mock_get_user_data.return_value = tas_user
    yield mock_get_user_data


@pytest.fixture
def test_manager(tas_mock, regular_user_with_underscore):
    yield UserSystemsManager(regular_user_with_underscore)


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


@pytest.fixture
def mock_404(monkeypatch):
    mock_error = HTTPError()
    monkeypatch.setattr(mock_error, 'response', MagicMock(status_code=404))
    yield mock_error


def test_init(tas_mock, test_manager, regular_user_with_underscore):
    # Assert that the default system will be loaded
    assert test_manager.system == settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS['frontera']
    assert test_manager.tas_user['username'] == regular_user_with_underscore.username

    # Assert that it loads a system by name
    mgr = UserSystemsManager(regular_user_with_underscore, system_name='longhorn')
    assert mgr.system == settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS['longhorn']


def test_lookup_methods(test_manager):
    assert test_manager.get_name() == 'My Data (Frontera)'
    assert test_manager.get_host() == 'frontera.tacc.utexas.edu'
    assert test_manager.get_system_id() == 'frontera.home.user-name'
    assert test_manager.get_sys_tas_user_dir() == '/home1/01234/user_name'
    assert test_manager.get_private_directory() == '01234/user_name'


def test_setup_private_system_exists(test_manager, mock_service_account):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/agave/systems/storage.json')) as f:
        system = json.load(f)
        mock_service_account.systems.get.return_value = system
        assert test_manager.setup_private_system().id == system['id']


def test_setup_private_system(test_manager, mock_service_account, regular_user_with_underscore, mock_404, monkeypatch):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/agave/systems/storage.json')) as f:
        system = json.load(f)
    # Mock all the service functions
    mock_service_account.systems.get.side_effect = mock_404
    system_definition = StorageSystem.from_dict(mock_service_account, system)
    mock_get_system_definition = MagicMock(return_value=system_definition)
    monkeypatch.setattr(test_manager, 'get_system_definition', mock_get_system_definition)

    # Run the test
    assert test_manager.setup_private_system().id == system_definition.id

    mock_service_account.systems.updateRole.assert_called_with(
        body={'role': "OWNER", 'username': regular_user_with_underscore.username},
        systemId=system_definition.id)
    system_key = SSHKeys.objects.all()[0]
    assert system_key.user == regular_user_with_underscore
    host_key = HostKeys.objects.all()[0]
    assert host_key.hostname == system['storage']['host']
    key_object = Keys.objects.get(ssh_keys=system_key)
    assert key_object.system == system['id']


def test_get_system_definition(test_manager, mock_service_account, mock_404):
    mock_service_account.systems.get.side_effect = mock_404
    system = test_manager.get_system_definition("public_key", "private_key")
    assert system.name == "frontera.home.user-name"
    assert system.storage.host == "frontera.tacc.utexas.edu"
    assert system.storage.root_dir == "/home1/01234/user_name"
    assert system.storage.auth.public_key == "public_key"
    assert system.storage.auth.private_key == "private_key"
