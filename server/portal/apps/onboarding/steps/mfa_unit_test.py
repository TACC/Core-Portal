from mock import ANY, MagicMock
from portal.apps.onboarding.steps.mfa import MFAStep
import pytest


@pytest.fixture
def mock_mfa_check(mocker):
    yield mocker.patch('portal.apps.onboarding.steps.mfa_unit_test.MFAStep.mfa_check', autospec=True)


@pytest.fixture
def mock_mfa_log(mocker):
    yield mocker.patch.object(MFAStep, 'log')


@pytest.fixture
def mock_mfa_complete(mocker):
    yield mocker.patch.object(MFAStep, 'complete')


@pytest.fixture
def mock_mfa_request(mocker):
    response = MagicMock(
        json=MagicMock(
            return_value={
                "result": [
                    {"type": "tacc-soft-token"}
                ]
            }
        )
    )
    yield mocker.patch('portal.apps.onboarding.steps.mfa.requests.get',
                       return_value=response,
                       autospec=True)


@pytest.fixture
def mock_mfa_prepare(mocker):
    yield mocker.patch.object(MFAStep, 'prepare')


def test_mfa_found(authenticated_user, mock_mfa_check, mock_mfa_complete):
    mock_mfa_check.return_value = True
    step = MFAStep(authenticated_user)
    step.process()
    mock_mfa_complete.assert_called_with(
        "Multi-factor authentication pairing verified"
    )


def test_mfa_not_found(authenticated_user, mock_mfa_check, mock_mfa_log):
    step = MFAStep(authenticated_user)
    mock_mfa_check.return_value = False
    step.process()
    mock_mfa_log.assert_called_with(ANY, data=ANY)


def test_mfa_check(authenticated_user, mock_mfa_request):
    step = MFAStep(authenticated_user)
    mock_mfa_request.return_value.json.return_value["result"] = [{"type": "tacc-soft-token"}]
    result = step.mfa_check()
    assert result is True


def test_mfa_check_failure(authenticated_user, mock_mfa_request):
    step = MFAStep(authenticated_user)
    mock_mfa_request.return_value.json.return_value["result"] = []
    result = step.mfa_check()
    assert result is False


def test_client_action(rf, authenticated_user, mock_mfa_prepare):
    step = MFAStep(authenticated_user)
    request = rf.post("/api/onboarding/user/test")
    request.user = authenticated_user
    step.client_action("user_confirm", {}, request)
    mock_mfa_prepare.assert_called_with()
