from django.test import TestCase, RequestFactory, override_settings
from django.contrib.auth import get_user_model
from mock import patch, ANY
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.allocation import AllocationStep
from pytas.http import TASClient

class AllocationStepTest(TestCase):
    def setUp(self):
        super(AllocationStepTest, self).setUp()
        self.user = get_user_model().objects.create_user('test', 'test@user.com', 'test')

        # Mock the step's complete function so we can spy on it
        self.mock_complete_patcher = patch(
            'portal.apps.onboarding.steps.allocation_unit_test.AllocationStep.complete'
        )
        self.mock_complete = self.mock_complete_patcher.start()

        # Mock the step's fail function so we can spy on it
        self.mock_fail_patcher = patch(
            'portal.apps.onboarding.steps.allocation_unit_test.AllocationStep.fail'
        )
        self.mock_fail = self.mock_fail_patcher.start()

        # Mock TAS
        self.mock_get_allocations_patcher = patch(
            'portal.apps.onboarding.steps.allocation.get_allocations',
        )
        self.mock_get_allocations = self.mock_get_allocations_patcher.start()

        self.step = AllocationStep(self.user)

    def tearDown(self):
        super(AllocationStepTest, self).tearDown()
        self.mock_complete_patcher.stop()
        self.mock_fail_patcher.stop()
        self.mock_get_allocations_patcher.stop()

    @override_settings(ALLOCATION_SYSTEMS=[])
    def test_no_allocation_setting(self):
        self.step.process()
        self.mock_complete.assert_called_with("No systems are required for access to this portal")

    @override_settings(ALLOCATION_SYSTEMS=['stampede2.tacc.utexas.edu'])
    @patch('portal.apps.onboarding.steps.allocation_unit_test.AllocationStep.log')
    def test_tas_project_retrieval_failure(self, mock_log):
        # Make the projects_for_user function generate an exception
        self.mock_get_allocations.side_effect = Exception()
        self.step.process()
        mock_log.assert_called_with("Unable to retrieve a list of projects")

    @override_settings(ALLOCATION_SYSTEMS=['stampede2.tacc.utexas.edu'])
    def test_user_has_no_resources(self):
        self.mock_get_allocations.return_value = { }
        self.step.process()
        self.mock_fail.assert_called_with(
            "You must have a project allocation with one of the required systems for this portal."
        )

    @override_settings(ALLOCATION_SYSTEMS=['stampede2.tacc.utexas.edu'])
    def test_user_has_wrong_resources(self):
        self.mock_get_allocations.return_value = {
            "ls5.tacc.utexas.edu" : [ ]
        }
        self.step.process()
        self.mock_fail.assert_called_with(
            "You must have a project allocation with one of the required systems for this portal."
        )

    @override_settings(ALLOCATION_SYSTEMS=['stampede2.tacc.utexas.edu'])
    def test_user_has_system(self):
        self.mock_get_allocations.return_value = {
            "stampede2.tacc.utexas.edu" : [ ]
        }
        self.step.process()
        self.mock_complete.assert_called_with("You have the required systems for accessing this portal")