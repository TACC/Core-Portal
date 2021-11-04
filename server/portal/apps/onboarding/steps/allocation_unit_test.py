from portal.apps.onboarding.steps.allocation import AllocationStep
import pytest


@pytest.fixture
def get_allocations_mock(mocker):
    get_allocations = mocker.patch('portal.apps.onboarding.steps.allocation.get_allocations')
    get_allocations.return_value = {'hosts': {},
            'portal_alloc': None,
            'active': [{'allocation'}],
            'inactive': [{'allocation'}] }
    yield get_allocations


@pytest.fixture
def allocation_step_complete_mock(mocker):
    yield mocker.patch.object(AllocationStep, 'complete')


def test_get_allocations(regular_user, get_allocations_mock, allocation_step_complete_mock):
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_mock.assert_called_with("username", force=True)
    allocation_step_complete_mock.assert_called_with("Allocations retrieved", data={'hosts': {},
            'portal_alloc': None,
            'active': [{'allocation'}],
            'inactive': [{'allocation'}] })
