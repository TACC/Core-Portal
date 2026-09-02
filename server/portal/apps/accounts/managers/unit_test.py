from mock import MagicMock
from portal.apps.accounts.managers.accounts import add_pub_key_to_resource
from portal.apps.accounts.managers.ssh_keys import KeysManager
from portal.apps.accounts.managers.ssh_keys import KeyCannotBeAdded
from paramiko.ssh_exception import (
    AuthenticationException,
    ChannelException,
    SSHException
)
import pytest


@pytest.fixture
def mock_lookup_keys_manager(mocker):
    yield mocker.patch(
        'portal.apps.accounts.managers.accounts._lookup_keys_manager',
        return_value=MagicMock(
            spec=KeysManager
        )
    )


def _run_add_pub_key_to_resource(user):
    password = "testpassword"
    token = "123456"
    system_id = "portal-home.testuser"
    pub_key = 'pubkey'
    hostname = "data.tacc.utexas.edu"
    return add_pub_key_to_resource(user, password, token, system_id, pub_key, hostname)


# AuthenticationException occurs with bad password/token when trying to push keys
def test_authentication_exception(regular_user, mock_lookup_keys_manager):
    mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=AuthenticationException("Authentication failed."))
    result, message, status = _run_add_pub_key_to_resource(regular_user)
    assert result is False
    assert status == 403
    assert message == "Authentication failed."


# Channel exception occurs when server is reachable but returns an error while paramiko is attempting to open a channel
def test_channel_exception(regular_user, mock_lookup_keys_manager):
    mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=ChannelException(999, "Mock Channel Exception"))
    result, message, status = _run_add_pub_key_to_resource(regular_user)
    assert result is False
    assert status == 500


# SSHException occurs when paramiko is unable to open SSH connection to server
def test_ssh_exception(regular_user, mock_lookup_keys_manager):
    mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=SSHException())
    result, message, status = _run_add_pub_key_to_resource(regular_user)
    assert result is False
    assert status == 500


# KeyCannotBeAdded exception occurs when authorized_keys file cannot be modified
def test_KeyCannotBeAdded_exception(regular_user, mock_lookup_keys_manager):
    mock_lookup_keys_manager.return_value.add_public_key = MagicMock(
        side_effect=KeyCannotBeAdded("MockKeyCannotBeAdded", "MockOutput", "MockErrorOutput"))
    result, message, status = _run_add_pub_key_to_resource(regular_user)
    assert result is False
    assert status == 503
    assert message == "KeyCannotBeAdded"


# Catch all for unknown exception types
def test_unknown_exception(regular_user, mock_lookup_keys_manager):
    exception_message = "Mock unknown exception"
    mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=Exception(exception_message))
    try:
        result, message, status = _run_add_pub_key_to_resource(regular_user)
    except Exception as exc:
        assert str(exc) == exception_message
