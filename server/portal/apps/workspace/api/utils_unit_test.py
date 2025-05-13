from django.conf import settings
from portal.apps.workspace.api.views import AppsTrayView
from portal.apps.workspace.models import AppTrayCategory
from portal.apps.workspace.models import JobSubmission
import json
import os
import pytest
from tapipy.tapis import TapisResult
from tapipy.errors import InternalServerError, UnauthorizedError
from django.core.management import call_command
from mock import MagicMock, patch
from portal.apps.workspace.api.utils import (
    push_keys_required_if_not_credentials_ensured,
    system_credentials_ok,
    should_push_keys,
    create_system_credentials,
)


@patch("portal.apps.workspace.api.utils.system_credentials_ok")
@patch("portal.apps.workspace.api.utils.should_push_keys")
@patch("portal.apps.workspace.api.utils.create_system_credentials")
def test_push_keys_required_if_not_credentials_ensured_no_keys_required(
    mock_create_system_credentials, mock_should_push_keys, mock_system_credentials_ok, authenticated_user, mock_tapis_client
):
    mock_system_credentials_ok.return_value = False
    mock_should_push_keys.return_value = False
    system = {
        'host': 'frontera.tacc.utexas.edu',
        'defaultAuthnMethod': 'PKI_KEYS',
    }
    tapis_system = TapisResult(**system)

    mock_tapis_client.systems.getSystem.return_value = tapis_system

    result = push_keys_required_if_not_credentials_ensured("test_system", authenticated_user)

    assert result is False
    mock_system_credentials_ok.assert_called_once_with("test_system", authenticated_user)
    mock_should_push_keys.assert_called_once_with(tapis_system)
    mock_create_system_credentials.assert_called_once_with(
        mock_tapis_client, authenticated_user.username, "test_system", createTmsKeys=True
    )


@patch("portal.apps.workspace.api.utils.system_credentials_ok")
@patch("portal.apps.workspace.api.utils.should_push_keys")
@patch("portal.apps.workspace.api.utils.create_system_credentials")
def test_push_keys_required_if_not_credentials_ensured_credentials_ok(
    mock_create_system_credentials, mock_should_push_keys, mock_system_credentials_ok, authenticated_user, mock_tapis_client
):
    mock_system_credentials_ok.return_value = True

    result = push_keys_required_if_not_credentials_ensured("test_system", authenticated_user)

    assert result is False
    mock_system_credentials_ok.assert_called_once_with("test_system", authenticated_user)
    mock_should_push_keys.assert_not_called()
    mock_create_system_credentials.assert_not_called()
