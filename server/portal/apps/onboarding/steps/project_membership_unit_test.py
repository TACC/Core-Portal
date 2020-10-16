from django.contrib.auth import get_user_model
from portal.apps.onboarding.steps.project_membership import ProjectMembershipStep
import pytest


@pytest.fixture
def tas_client_projects_for_user_mock(mocker):
    task_client_mock = mocker.patch('portal.apps.onboarding.steps.project_membership.TASClient', autospec=True)
    task_client_mock.return_value.projects_for_user.return_value = [
        {"chargeCode": "TACC-Team"}, {"chargeCode": "MyProject"}]
    yield task_client_mock


@pytest.fixture
def project_membership_step(authenticated_user):
    step = ProjectMembershipStep(get_user_model().objects.get(username=authenticated_user.username))
    yield step


@pytest.fixture
def project_membership_fail_mock(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'fail')


@pytest.fixture
def project_membership_complete_mock(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'complete')


def test_no_required_project(settings, authenticated_user,
                             tas_client_projects_for_user_mock, project_membership_complete_mock):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'required_projects': []
            }
        }
    ]
    project_membership_step = ProjectMembershipStep(authenticated_user)
    project_membership_step.process()
    project_membership_complete_mock.assert_called_with("No project is required for access to this portal")


def test_unable_to_get_users_projects(settings, authenticated_user,
                                      tas_client_projects_for_user_mock, project_membership_fail_mock):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'required_projects': [ 'SOME_OTHER_PROJECT' ]
            }
        }
    ]
    tas_client_projects_for_user_mock.return_value.projects_for_user.side_effect = Exception()
    project_membership_step = ProjectMembershipStep(authenticated_user)
    project_membership_step.process()
    project_membership_fail_mock.assert_called_with("Unable to get projects for user")


def test_not_member_of_project(settings, authenticated_user,
                               tas_client_projects_for_user_mock, project_membership_fail_mock):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'required_projects': [ 'SOME_OTHER_PROJECT', 'ONE_OTHER_PROJECT' ]
            }
        }
    ]
    project_membership_step = ProjectMembershipStep(authenticated_user)
    project_membership_step.process()
    project_membership_fail_mock.assert_called_with("You must be added to one of the required project(s) "
                                                    "(e.g. SOME_OTHER_PROJECT, ONE_OTHER_PROJECT) in order "
                                                    "to access this portal")


def test_member_of_single_project_list(settings, authenticated_user,
                                       tas_client_projects_for_user_mock, project_membership_complete_mock):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'required_projects': [ 'MyProject' ]
            }
        }
    ]
    project_membership_step = ProjectMembershipStep(authenticated_user)
    project_membership_step.process()
    project_membership_complete_mock.assert_called_with("You are on a required project needed to access this portal")


def test_member_of_project_list(settings, authenticated_user,
                                tas_client_projects_for_user_mock, project_membership_complete_mock):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep',
            'settings': {
                'required_projects': [ 'SOME_OTHER_PROJECT', 'MyProject' ]
            }
        }
    ]
    project_membership_step = ProjectMembershipStep(authenticated_user)
    project_membership_step.process()
    project_membership_complete_mock.assert_called_with("You are on a required project needed to access this portal")
