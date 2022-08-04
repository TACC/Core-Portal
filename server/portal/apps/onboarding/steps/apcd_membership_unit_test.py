from django.conf import settings
from portal.apps.onboarding.steps.apcd_membership import ApcdMembershipStep
from portal.apps.onboarding.models import SetupEvent
from mock import MagicMock, ANY
import pytest
import json
import os


@pytest.fixture
def tas_client(mocker):
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_project.json')) as f:
        tas_project = json.load(f)
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_project_users.json')) as f:
        tas_project_users = json.load(f)
    tas_client_mock = mocker.patch('portal.apps.onboarding.steps.apcd_membership.TASClient', autospec=True)
    tas_client_mock.return_value.project.return_value = tas_project
    tas_client_mock.return_value.get_project_users.return_value = tas_project_users
    yield tas_client_mock


@pytest.fixture
def apcd_membership_step(settings, regular_user, tas_client):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = [
        {
            'step': 'portal.apps.onboarding.steps.apcd_membership.ApcdMembershipStep',
            'settings': {
                'project_sql_id': 12345,
                'userlink': {
                    'url': '/',
                    'text': 'Request Access'
                },
                'retry': True
            }
        }
    ]
    step = ApcdMembershipStep(regular_user)
    yield step


@pytest.fixture
def apcd_membership_log(mocker):
    yield mocker.patch.object(ApcdMembershipStep, 'log')


@pytest.fixture
def apcd_membership_fail(mocker):
    yield mocker.patch.object(ApcdMembershipStep, 'fail')


@pytest.fixture
def apcd_membership_complete(mocker):
    yield mocker.patch.object(ApcdMembershipStep, 'complete')


def test_is_project_member(tas_client, apcd_membership_step):
    assert apcd_membership_step.is_project_member()
    tas_client.return_value.get_project_users.return_value = []
    assert not apcd_membership_step.is_project_member()


def test_apcd_user_is_member(monkeypatch, apcd_membership_step, apcd_membership_complete):
    def mock_is_project_member():
        return True
    monkeypatch.setattr(apcd_membership_step, 'is_project_member', mock_is_project_member)
    apcd_membership_step.process()
    apcd_membership_complete.assert_called_with(
        "You have the required project membership to access this portal."
    )


def test_process_user_is_not_member(monkeypatch, apcd_membership_step, apcd_membership_log):
    def mock_is_project_member():
        return False
    monkeypatch.setattr(apcd_membership_step, 'is_project_member', mock_is_project_member)
    apcd_membership_step.process()
    apcd_membership_log.assert_called_with(
        "Please make a request to use this portal.",
        data={
            'userlink': {
                'url': '/',
                'text': 'Request Access'
            }
        }
    )
