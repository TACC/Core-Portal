
from portal.apps.system_creation.utils import (
    call_reactor,
    _create_substitutions,
    substitute_user_variables
)
import pytest

pytestmark = pytest.mark.django_db


def test_call_reactor(regular_user, mocker):
    mock_service_account = mocker.patch('portal.apps.system_creation.utils.service_account')
    mock_register_webhook = mocker.patch('portal.apps.system_creation.utils.register_webhook')
    mock_register_webhook.return_value = "MOCK_WEBHOOK_URL"
    mock_service_account.return_value.actors.sendMessage.return_value = {
        "executionId": "mock.executionId"
    }
    variables = {
        "testvar_1": "testvalue_1"
    }
    result = call_reactor(
        regular_user,
        "test.systemId",
        "test.template",
        variables,
        force=False,
        dryrun=False,
        callback="test.callback",
        callback_data=None
    )

    expected_message = {
        "username": "username",
        "force": False,
        "dryrun": False,
        "template": "test.template",
        "variables": variables,
        "webhook": "MOCK_WEBHOOK_URL"
    }
    mock_service_account.return_value.actors.sendMessage.assert_called_with(
        actorId="test.actorId",
        body=expected_message
    )
    assert result['executionId'] == "mock.executionId"


def test_create_substitutions(regular_user, mocker):
    # Setup mocks to external services
    mock_tas = mocker.patch('portal.apps.system_creation.utils.TASClient.get_user')
    mock_tas.return_value = {
        'homeDirectory': "12345/MOCK_WORK"
    }

    subs = _create_substitutions(regular_user)
    expected = {
        "tasdir": "12345/MOCK_WORK",
        "username": "username",
        "portal": "test.portal"
    }
    assert subs == expected


def test_substitute_user_variables(regular_user_with_underscore, mocker):
    mock_substitutions = mocker.patch('portal.apps.system_creation.utils._get_tas_dir')
    mock_substitutions.return_value = "12345/MOCK_WORK"
    systemId, variables = substitute_user_variables(
        regular_user_with_underscore,
        "data-tacc-work-{username}",
        {
            "description": "Home system for {portal}",
            "site": "{portal}",
            "rootDir": "/work/{tasdir}",
            "name": "data-tacc-work-{username}",
            "id": "data-tacc-work-{username}"
        }
    )
    expected_variables = {
        "rootDir": "/work/12345/MOCK_WORK",
        "description": "Home system for test.portal",
        "site": "test.portal",
        "id": "data-tacc-work-user-name",
        "name": "data-tacc-work-user-name"
    }
    assert systemId == "data-tacc-work-user-name"
    assert variables == expected_variables
