from portal.apps.onboarding.steps.system_creation import SystemCreationStep
from mock import call
import pytest


@pytest.fixture(autouse=True)
def mock_get_user_storage_systems(mocker, settings):
    mock = mocker.patch('portal.apps.onboarding.steps.system_creation.get_user_storage_systems')
    mock.return_value = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
    yield mock


@pytest.fixture(autouse=True)
def mock_index_allocations(mocker):
    yield mocker.patch('portal.apps.onboarding.steps.system_creation.index_allocations')


@pytest.fixture(autouse=True)
def mock_log(mocker):
    yield mocker.patch.object(SystemCreationStep, 'log')


@pytest.fixture
def mock_setup_user(mocker):
    yield mocker.patch('portal.apps.onboarding.steps.system_creation.setup_user')


@pytest.fixture
def mock_complete(mocker):
    yield mocker.patch.object(SystemCreationStep, 'complete')


def test_process(mock_setup_user, regular_user):
    step = SystemCreationStep(regular_user)
    step.process()
    frontera_call = call("username", "frontera")
    longhorn_call = call("username", "longhorn")
    mock_setup_user.assert_has_calls([frontera_call, longhorn_call], any_order=True)
