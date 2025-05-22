from tapipy.tapis import TapisResult
from tapipy.errors import UnauthorizedError
from mock import patch
from portal.apps.workspace.api.utils import (
    push_keys_required_if_not_credentials_ensured,
)


def test_push_keys_required_if_not_credentials_ensured_successful_credential_creation(
    authenticated_user, mock_tapis_client
):
    """
    Test that the push_keys_required_if_not_credentials_ensured function returns False when the user has system credentials
    and the system does not require keys to be pushed.
    """
    system = {
        "id": "test_system",
        "host": "frontera.tacc.utexas.edu",
        "defaultAuthnMethod": "TMS_KEYS",
    }
    tapis_system = TapisResult(**system)

    mock_tapis_client.systems.checkUserCredential.side_effect = UnauthorizedError()
    mock_tapis_client.systems.getSystem.return_value = tapis_system
    mock_tapis_client.systems.createUserCredential.return_value = {
        "result": None,
        "status": "success",
        "message": "SYSAPI_CRED_UPDATED Credential updated.",
        "version": "1.8.3",
        "commit": "9a57c9d7",
        "build": "2025-04-29T13:47:25Z",
        "metadata": None,
    }

    result = push_keys_required_if_not_credentials_ensured(
        "test_system", authenticated_user
    )

    assert result is False
    mock_tapis_client.systems.createUserCredential.assert_called_once_with(
        systemId="test_system",
        userName=authenticated_user.username,
        createTmsKeys=True,
        skipCredentialCheck=False,
    )


@patch("portal.apps.workspace.api.utils.should_push_keys")
@patch("portal.apps.workspace.api.utils.create_system_credentials")
def test_push_keys_required_if_not_credentials_ensured_credentials_ok(
    mock_create_system_credentials,
    mock_should_push_keys,
    authenticated_user,
    mock_tapis_client,
):
    """
    Test that the function returns False when the user has valid system credentials.
    """
    mock_tapis_client.systems.checkUserCredential.return_value = {
        "result": None,
        "status": "success",
        "message": "SYSAPI_CRED_OK Credential validation succeeded.",
        "version": "1.8.3",
        "commit": "9a57c9d7",
        "build": "2025-04-29T13:47:25Z",
        "metadata": None,
    }

    result = push_keys_required_if_not_credentials_ensured(
        "test_system", authenticated_user
    )

    assert result is False
    mock_should_push_keys.assert_not_called()
    mock_create_system_credentials.assert_not_called()


def test_push_keys_required_if_not_credentials_ensured_push_keys_required(
    authenticated_user, mock_tapis_client
):
    """
    Test that the push_keys_required_if_not_credentials_ensured function
    returns True when the user does not have system credentials
    and the system requires keys to be pushed.
    """
    system = {
        "id": "test_system",
        "host": "frontera.tacc.utexas.edu",
        "defaultAuthnMethod": "PKI_KEYS",
    }
    tapis_system = TapisResult(**system)

    mock_tapis_client.systems.checkUserCredential.side_effect = UnauthorizedError()
    mock_tapis_client.systems.getSystem.return_value = tapis_system

    result = push_keys_required_if_not_credentials_ensured(
        "test_system", authenticated_user
    )

    assert result is True
    mock_tapis_client.systems.createUserCredential.assert_not_called()
