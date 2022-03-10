from portal.apps.onboarding.steps.key_service_creation import KeyServiceCreationStep
from portal.libs.agave.models.systems.storage import StorageSystem
from mock import call, ANY, MagicMock
import pytest


@pytest.fixture(autouse=True)
def mock_tas_dir(mocker):
    mock_tas_dir = mocker.patch('portal.apps.system_creation.utils._get_tas_dir')
    mock_tas_dir.return_value = "12345/username"
    yield mock_tas_dir


@pytest.fixture(autouse=True)
def mock_get_user_storage_systems(mocker, settings):
    mock = mocker.patch('portal.apps.onboarding.steps.key_service_creation.get_user_storage_systems')
    mock.return_value = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
    yield mock


@pytest.fixture
def mock_call_reactor(mocker):
    yield mocker.patch('portal.apps.onboarding.steps.key_service_creation.call_reactor')


@pytest.fixture(autouse=True)
def mock_log(mocker):
    yield mocker.patch.object(KeyServiceCreationStep, 'log')


@pytest.fixture
def mock_complete(mocker):
    yield mocker.patch.object(KeyServiceCreationStep, 'complete')


@pytest.fixture
def mock_fail(mocker):
    yield mocker.patch.object(KeyServiceCreationStep, 'fail')


def test_process_skip(regular_user, mock_call_reactor, mocker, mock_complete):
    mock_storage_system = mocker.patch.object(StorageSystem, 'test')
    mock_storage_system.return_value = (True, None)
    step = KeyServiceCreationStep(regular_user)
    step.process()
    mock_complete.assert_called_with("Found existing storage systems")


def test_process(regular_user, mock_call_reactor, mocker):
    mock_storage_system = mocker.patch.object(StorageSystem, 'test')
    mock_storage_system.return_value = (False, None)
    step = KeyServiceCreationStep(regular_user)
    step.process()
    frontera_call = call(
        regular_user,
        'frontera.home.username',
        'wma-storage',
        {
            'name': 'My Data (Frontera)',
            'site': 'frontera',
            'description': 'My Data on Frontera for username',
            'systemId': 'frontera.home.username',
            'host': 'frontera.tacc.utexas.edu',
            'rootDir': '/home1/12345/username',
            'port': 22,
            'icon': None,
            'hidden': False
        },
        callback='portal.apps.onboarding.steps.key_service_creation.KeyServiceCreationCallback',
        callback_data={'expected': 'frontera.home.username'},
        dryrun=False,
        force=True
    )
    longhorn_call = call(
        regular_user,
        'longhorn.home.username',
        'wma-storage',
        {
            'name': 'My Data (Longhorn)',
            'host': 'longhorn.tacc.utexas.edu',
            'rootDir': '/home/12345/username',
            'port': 22,
            'requires_allocation': 'longhorn3',
            'systemId': 'longhorn.home.username',
            'icon': None,
            'hidden': False
        },
        callback='portal.apps.onboarding.steps.key_service_creation.KeyServiceCreationCallback',
        callback_data={'expected': 'longhorn.home.username'},
        dryrun=False,
        force=True
    )
    stockyard_call = call(
        regular_user,
        'cloud.corral.work.username',
        'wma-storage',
        {
            'name': 'My Data (Work)',
            'host': 'cloud.corral.tacc.utexas.edu',
            'rootDir': '/home/12345/username',
            'port': 2222,
            'systemId': 'cloud.corral.work.username',
            'icon': None,
            'hidden': True
        },
        callback='portal.apps.onboarding.steps.key_service_creation.KeyServiceCreationCallback',
        callback_data={'expected': 'cloud.corral.work.username'},
        dryrun=False,
        force=True
    )
    mock_call_reactor.assert_has_calls([frontera_call, longhorn_call, stockyard_call], any_order=True)


def test_mark_system(regular_user, mock_complete, mock_fail, monkeypatch, mocker):
    mock_execute = mocker.patch('portal.apps.onboarding.steps.key_service_creation.execute_setup_steps')
    step = KeyServiceCreationStep(regular_user)
    monkeypatch.setattr(
        step, 'last_event', MagicMock(
            data={
                'requested': ['longhorn.home.username', 'frontera.home.username'],
                'successful': [],
                'failed': []
            }
        )
    )
    step.mark_system('longhorn.home.username', 'successful')
    step.mark_system('frontera.home.username', 'failed')
    mock_fail.assert_called_with(
        ANY,
        data={
            'requested': [],
            'successful': ['longhorn.home.username'],
            'failed': ['frontera.home.username']
        }
    )
    step.mark_system('frontera.home.username', 'successful')
    mock_complete.assert_called_with(
        ANY,
        data={
            'requested': [],
            'successful': ['longhorn.home.username', 'frontera.home.username'],
            'failed': []
        }
    )
    mock_execute.apply_async.assert_called_with(args=["username"])
