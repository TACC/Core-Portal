from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from mock import patch
from pytas.http import TASClient
from portal.apps.onboarding.steps.project_membership import ProjectMembershipStep


class ProjectMembershipStepTest(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        # Mock the step's complete function so we can spy on it
        self.mock_complete_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.complete'
        )
        self.mock_complete = self.mock_complete_patcher.start()

        # Mock the step's fail function so we can spy on it
        self.mock_fail_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.fail'
        )
        self.mock_fail = self.mock_fail_patcher.start()

        self.mock_tas_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.TASClient',
            spec=TASClient
        )
        self.mock_tas = self.mock_tas_patcher.start()

        self.mock_tas.return_value.projects_for_user.return_value = [
            {
                "chargeCode": "TACC-Team"
            },
            {
                "chargeCode": "MyProject"
            }
        ]

        self.step = ProjectMembershipStep(get_user_model().objects.get(username="username"))

    def tearDown(self):
        self.mock_complete_patcher.stop()
        self.mock_fail_patcher.stop()
        self.mock_tas_patcher.stop()

    @override_settings(REQUIRED_PROJECTS=[])
    def test_no_required_project(self):
        self.step.process()
        self.mock_complete.assert_called_with("No project is required for access to this portal")

    @override_settings(REQUIRED_PROJECTS=['SOME_OTHER_PROJECT'])
    def test_unable_to_get_users_projects(self):
        # Make the projects_for_user function generate an exception
        self.mock_tas.return_value.projects_for_user.side_effect = Exception()
        self.step.process()
        self.mock_fail.assert_called_with("Unable to get projects for user")

    @override_settings(REQUIRED_PROJECTS=['SOME_OTHER_PROJECT', 'ONE_OTHER_PROJECCT'])
    def test_not_member_of_project(self):
        self.step.process()
        self.mock_fail.assert_called_with("You must be added to one of the required project(s) (e.g. SOME_OTHER_PROJECT,"
                                          " ONE_OTHER_PROJECCT) in order to access this portal")

    @override_settings(REQUIRED_PROJECTS=['MyProject'])
    def test_member_of_single_project_list(self):
        self.step.process()
        self.mock_complete.assert_called_with("You are on a required project needed to access this portal")

    @override_settings(REQUIRED_PROJECTS=['SOME_THER_PROJECT', 'MyProject'])
    def test_member_of_project_list(self):
        self.step.process()
        self.mock_complete.assert_called_with("You are on a required project needed to access this portal")
