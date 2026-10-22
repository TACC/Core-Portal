from unittest.mock import ANY

import pytest
from django.conf import settings

from portal.apps.onboarding.steps.allocation import AllocationStep


@pytest.fixture
def get_allocations_mock(mocker):
    get_allocations = mocker.patch("portal.apps.onboarding.steps.allocation.get_allocations")
    get_allocations.return_value = {
        "hosts": {
            "vista.tacc.utexas.edu": {},
            "frontera.tacc.utexas.edu": {},
        },
        "portal_alloc": [],
        "active": [{"allocation"}],
        "inactive": [{"allocation"}],
    }
    yield get_allocations


@pytest.fixture
def get_allocations_failure_mock(mocker):
    get_allocations = mocker.patch("portal.apps.onboarding.steps.allocation.get_allocations")
    get_allocations.return_value = {"hosts": {}, "portal_alloc": None, "active": [], "inactive": []}
    yield get_allocations


@pytest.fixture
def get_allocations_with_expected_systems_check_failure_mock(mocker):
    get_allocations = mocker.patch("portal.apps.onboarding.steps.allocation.get_allocations")
    get_allocations.return_value = {
        "hosts": {
            "vista.tacc.utexas.edu": {},
            "frontera.tacc.utexas.edu": {},
        },
        "portal_alloc": [],
        "active": [{"allocation"}],
        "inactive": [{"allocation"}],
    }
    yield get_allocations


@pytest.fixture
def allocation_step_complete_mock(mocker):
    yield mocker.patch.object(AllocationStep, "complete")


@pytest.fixture
def allocation_step_log_mock(mocker):
    yield mocker.patch.object(AllocationStep, "log")


def test_get_allocations_with_expected_systems_check_success(
    regular_user, get_allocations_mock, allocation_step_complete_mock
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {"expected_hosts": ["vista.tacc.utexas.edu", "frontera.tacc.utexas.edu"]},
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_mock.assert_called_with("username", force=True)
    allocation_step_complete_mock.assert_called_with(
        "Allocations retrieved",
        data={
            "hosts": {
                "vista.tacc.utexas.edu": {},
                "frontera.tacc.utexas.edu": {},
            },
            "portal_alloc": [],
            "active": [{"allocation"}],
            "inactive": [{"allocation"}],
        },
    )


def test_get_allocations_with_expected_systems_check_and_mode_is_all_success(
    regular_user, get_allocations_mock, allocation_step_complete_mock
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {
                "expected_hosts": ["vista.tacc.utexas.edu", "frontera.tacc.utexas.edu"],
                "expected_hosts_mode": "all",
            },
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_mock.assert_called_with("username", force=True)
    allocation_step_complete_mock.assert_called_with(
        "Allocations retrieved",
        data={
            "hosts": {
                "vista.tacc.utexas.edu": {},
                "frontera.tacc.utexas.edu": {},
            },
            "portal_alloc": [],
            "active": [{"allocation"}],
            "inactive": [{"allocation"}],
        },
    )


def test_get_allocations_with_expected_systems_check_and_mode_is_any_success(
    regular_user, get_allocations_mock, allocation_step_complete_mock
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {
                "expected_hosts": ["vista.tacc.utexas.edu", "frontera.tacc.utexas.edu"],
                "expected_hosts_mode": "any",
            },
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_mock.assert_called_with("username", force=True)
    allocation_step_complete_mock.assert_called_with(
        "Allocations retrieved",
        data={
            "hosts": {
                "vista.tacc.utexas.edu": {},
                "frontera.tacc.utexas.edu": {},
            },
            "portal_alloc": [],
            "active": [{"allocation"}],
            "inactive": [{"allocation"}],
        },
    )


def test_get_allocations_with_expected_systems_check_and_mode_is_any_failure(
    regular_user,
    allocation_step_log_mock,
    get_allocations_with_expected_systems_check_failure_mock,
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {
                "expected_hosts": ["vista.tacc.utexas.edu", "frontera.tacc.utexas.edu"],
                "expected_hosts_mode": "blah",
            },
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_with_expected_systems_check_failure_mock.assert_called_with("username", force=True)
    allocation_step_log_mock.assert_called_with("Invalid expected_hosts_mode: 'blah'")


def test_get_allocations_with_expected_systems_check_and_mode_is_typo_failure(
    regular_user,
    allocation_step_log_mock,
    get_allocations_with_expected_systems_check_failure_mock,
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {
                "expected_hosts": ["blah.tacc.utexas.edu", "blahblah.tacc.utexas.edu"],
                "expected_hosts_mode": "any",
            },
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_with_expected_systems_check_failure_mock.assert_called_with("username", force=True)
    allocation_step_log_mock.assert_called_with(
        "User username has no allocations on any of: ['blah.tacc.utexas.edu', 'blahblah.tacc.utexas.edu']"
    )


def test_get_allocations_with_expected_systems_check_failure(
    regular_user,
    allocation_step_log_mock,
    get_allocations_with_expected_systems_check_failure_mock,
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {"expected_hosts": ["blah.tacc.utexas.edu", "frontera.tacc.utexas.edu"]},
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_with_expected_systems_check_failure_mock.assert_called_with("username", force=True)
    allocation_step_log_mock.assert_called_with("User username is missing allocations on: ['blah.tacc.utexas.edu']")


def test_get_allocations_without_expected_systems_check_success(
    regular_user, get_allocations_mock, allocation_step_complete_mock
):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            "step": "portal.apps.onboarding.steps.allocation.AllocationStep",
            "settings": {},
        }
    ]
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_mock.assert_called_with("username", force=True)
    allocation_step_complete_mock.assert_called_with(
        "Allocations retrieved",
        data={
            "hosts": {
                "vista.tacc.utexas.edu": {},
                "frontera.tacc.utexas.edu": {},
            },
            "portal_alloc": [],
            "active": [{"allocation"}],
            "inactive": [{"allocation"}],
        },
    )


def test_get_allocations_without_expected_systems_check_failure(
    regular_user, get_allocations_failure_mock, allocation_step_log_mock
):
    step = AllocationStep(regular_user)
    step.process()
    get_allocations_failure_mock.assert_called_with("username", force=True)
    allocation_step_log_mock.assert_called_with(ANY)
