from portal.apps.onboarding.steps.tas_project_system_creation import TasProjectSystemCreationStep
from portal.libs.agave.models.systems.storage import StorageSystem
from mock import call 
import pytest
from django.conf import settings
import json
import os


@pytest.fixture
def mock_call_reactor(mocker):
    yield mocker.patch('portal.apps.onboarding.steps.tas_project_system_creation.call_reactor')


@pytest.fixture(autouse=True)
def mock_log(mocker):
    yield mocker.patch.object(TasProjectSystemCreationStep, 'log')


def test_process(regular_user, mock_call_reactor, mocker):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas_project_systems/project_systems.json')) as f:
        project_systems = json.load(f)
    mock_storage_system = mocker.patch.object(StorageSystem, 'test')
    mock_storage_system.return_value = (False, None)
    mocker.patch(
        'portal.apps.onboarding.steps.tas_project_system_creation.get_tas_project_system_variables',
        return_value=project_systems
    )
    step = TasProjectSystemCreationStep(regular_user)
    step.process()
    bcbs_call = call(
        regular_user,
        'apcd-test.bcbs.mockuser',
        'wma-storage',
        project_systems['apcd-test.bcbs.mockuser'],
        callback='portal.apps.onboarding.steps.tas_project_system_creation.TasProjectSystemCreationCallback',
        callback_data={'expected': 'apcd-test.bcbs.mockuser'},
        dryrun=False,
        force=True
    )
    submissions_call = call(
        regular_user,
        'apcd-test.submissions.mockuser',
        'wma-storage',
        project_systems['apcd-test.submissions.mockuser'],
        callback='portal.apps.onboarding.steps.tas_project_system_creation.TasProjectSystemCreationCallback',
        callback_data={'expected': 'apcd-test.submissions.mockuser'},
        dryrun=False,
        force=True
    )
    mock_call_reactor.assert_has_calls([bcbs_call, submissions_call], any_order=True)
