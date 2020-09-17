from portal.apps.onboarding.steps.allocation import AllocationStep
import pytest


@pytest.fixture
def tas_get_user_mock(mocker):
    mock_tas_patcher = mocker.patch(
        'portal.apps.onboarding.steps.allocation.TASClient.get_user',
        return_value={
            'piEligibility': 'Eligible'
        }
    )
    yield mock_tas_patcher


@pytest.fixture
def get_allocations_mock(mocker):
    get_allocations = mocker.patch('portal.apps.onboarding.steps.allocation.get_allocations')
    get_allocations_mock.return_value = {}
    yield get_allocations


@pytest.fixture
def allocation_step_complete_mock(mocker):
    yield mocker.patch.object(AllocationStep, 'complete')


@pytest.fixture
def allocation_step_log_mock(mocker):
    yield mocker.patch.object(AllocationStep, 'log')


@pytest.fixture
def allocation_step_prepare_mock(mocker):
    yield mocker.patch.object(AllocationStep, 'prepare')


def test_no_allocation_setting(settings, authenticated_user, allocation_step_complete_mock):
    settings.ALLOCATION_SYSTEMS = []
    step = AllocationStep(authenticated_user)
    step.process()
    allocation_step_complete_mock.assert_called_with("No systems are required for access to this portal")


def test_tas_project_retrieval_failure(settings, authenticated_user,
                                       get_allocations_mock, allocation_step_log_mock):
    settings.ALLOCATION_SYSTEMS = ['stampede2.tacc.utexas.edu']
    get_allocations_mock.side_effect = Exception()

    step = AllocationStep(authenticated_user)
    step.process()
    allocation_step_log_mock.assert_called_with("Unable to retrieve a list of projects")


def test_user_has_no_resources(settings, authenticated_user, tas_get_user_mock,
                               get_allocations_mock, allocation_step_log_mock):
    settings.ALLOCATION_SYSTEMS = ['stampede2.tacc.utexas.edu']

    step = AllocationStep(authenticated_user)
    step.process()

    allocation_step_log_mock.assert_called_with(
        "Verify that you have a project allocation with one of the required systems for this portal, then click the Confirm button.",
        data={
            "more_info": step.pi_eligible_message
        }
    )


def test_user_has_wrong_resources(settings, authenticated_user, tas_get_user_mock,
                                  get_allocations_mock, allocation_step_log_mock):
    settings.ALLOCATION_SYSTEMS = ['stampede2.tacc.utexas.edu']
    get_allocations_mock.return_value = {
        "ls5.tacc.utexas.edu": []
    }

    step = AllocationStep(authenticated_user)
    step.process()
    allocation_step_log_mock.assert_called_with(
        "Verify that you have a project allocation with one of the required systems for this portal, then click the Confirm button.",
        data={
            "more_info": step.pi_eligible_message
        }
    )


def test_user_has_no_resources_pi_inelligible(settings, authenticated_user, tas_get_user_mock,
                                              get_allocations_mock, allocation_step_log_mock):
    settings.ALLOCATION_SYSTEMS = ['stampede2.tacc.utexas.edu']
    tas_get_user_mock.return_value['piEligibility'] = 'Ineligible'

    step = AllocationStep(authenticated_user)
    step.process()
    allocation_step_log_mock.assert_called_with(
        "Verify that you have a project allocation with one of the required systems for this portal, then click the Confirm button.",
        data={
            "more_info": step.pi_ineligible_message
        }
    )


def test_user_has_system(settings, authenticated_user,
                         get_allocations_mock, allocation_step_complete_mock):
    settings.ALLOCATION_SYSTEMS = ['stampede2.tacc.utexas.edu']
    get_allocations_mock.return_value = {
        "stampede2.tacc.utexas.edu": []
    }
    step = AllocationStep(authenticated_user)
    step.process()
    allocation_step_complete_mock.assert_called_with("You have the required systems for accessing this portal")


def test_client_action(rf, authenticated_user, allocation_step_prepare_mock):
    request = rf.post("/api/onboarding/user/test")
    request.user = authenticated_user
    step = AllocationStep(authenticated_user)
    step.client_action("user_confirm", {}, request)
    allocation_step_prepare_mock.assert_called_with()
