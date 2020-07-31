
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from django.conf import settings
import pytest
import json
import os


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
