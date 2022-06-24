from django.test import (
    TestCase,
    override_settings
)
from mock import MagicMock, patch
from django.core.exceptions import ObjectDoesNotExist
from portal.apps.accounts.managers.accounts import add_pub_key_to_resource, setup
from portal.apps.accounts.managers.ssh_keys import KeysManager
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from portal.apps.accounts.managers.ssh_keys import KeyCannotBeAdded
from paramiko.ssh_exception import (
    AuthenticationException,
    ChannelException,
    SSHException
)
import pytest


@pytest.mark.django_db(transaction=True)
class AddPubKeyTests(TestCase):

    # Setup fresh mocks before each test
    def setUp(self):
        # Patch _lookup_keys_manager function to return a mocked KeysManager class
        self.patch_lookup_keys_manager = patch(
            'portal.apps.accounts.managers.accounts._lookup_keys_manager',
            return_value=MagicMock(
                spec=KeysManager
            )
        )
        self.mock_lookup_keys_manager = self.patch_lookup_keys_manager.start()

        # Patch check_user to return a mocked User model
        self.patch_check_user = patch('portal.apps.accounts.managers.accounts.check_user',
                                      return_value=MagicMock(
                                          spec=User
                                      )
                                      )
        self.mock_check_user = self.patch_check_user.start()

        # Teardown mocks after each test
        self.addCleanup(self.patch_lookup_keys_manager.stop)
        self.addCleanup(self.patch_check_user.stop)

    def run_add_pub_key_to_resource(self):
        username = "testuser"
        password = "testpassword"
        token = "123456"
        system_id = "portal-home.testuser"
        hostname = "data.tacc.utexas.edu"
        return add_pub_key_to_resource(username, password, token, system_id, hostname)

    # Patch KeysManager.ssh_keys.for_system function to throw Exception.
    # In reality, accessing ssh_keys attribute would throw RelatedOjbectDoesNotExist,
    # but this is a dynamically created Exception class that is difficult to simulate/catch
    #
    # Exception occurs when ssh_keys are not tracked by user model and the user must reset keys
    def test_user_model_exception(self):
        self.mock_check_user.return_value.ssh_keys = MagicMock(
            for_system=MagicMock(
                side_effect=ObjectDoesNotExist("Mock Exception while setting pub_key")
            ),
            for_hostname=MagicMock(
                side_effect=ObjectDoesNotExist("Mock Exception while setting pub_key")
            )
        )
        result, message, status = self.run_add_pub_key_to_resource()
        self.assertFalse(result)
        self.assertEqual(status, 409)

    # Patch returned KeysManager mock so that its add_public_key function throws the desired exception
    #
    # AuthenticationException occurs with bad password/token when trying to push keys
    def test_authentication_exception(self):
        self.mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=AuthenticationException())
        result, message, status = self.run_add_pub_key_to_resource()
        self.assertFalse(result)
        self.assertEqual(status, 403)

    # Channel exception occurs when server is reachable but returns an error while paramiko is attempting to open a channel
    def test_channel_exception(self):
        self.mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=ChannelException(999, "Mock Channel Exception"))
        result, message, status = self.run_add_pub_key_to_resource()
        self.assertFalse(result)
        self.assertEqual(status, 502)

    # SSHException occurs when paramiko is unable to open SSH connection to server
    def test_ssh_exception(self):
        self.mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=SSHException())
        result, message, status = self.run_add_pub_key_to_resource()
        self.assertFalse(result)
        self.assertEqual(status, 502)

    # KeyCannotBeAdded exception occurs when authorized_keys file cannot be modified
    def test_KeyCannotBeAdded_exception(self):
        self.mock_lookup_keys_manager.return_value.add_public_key = MagicMock(
            side_effect=KeyCannotBeAdded("MockKeyCannotBeAdded", "MockOutput", "MockErrorOutput"))
        result, message, status = self.run_add_pub_key_to_resource()
        self.assertFalse(result)
        self.assertEqual(status, 503)

    # Catch all for unknown exception types
    def test_unknown_exception(self):
        exception_message = "Mock unknown exception"
        self.mock_lookup_keys_manager.return_value.add_public_key = MagicMock(side_effect=Exception(exception_message))
        try:
            result, message, status = self.run_add_pub_key_to_resource()
        except Exception as exc:
            self.assertEqual(str(exc), exception_message)


@pytest.mark.django_db(transaction=True)
class TestUserSetup(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        super(TestUserSetup, self).setUp()

        self.mock_user = get_user_model().objects.get(username="username")

        self.mock_client_patcher = patch('portal.apps.auth.models.TapisOAuthToken.client')
        self.mock_client = self.mock_client_patcher.start()

        # check_user function should be faked
        self.mock_user.profile.setup_complete = False
        self.mock_check_user_patcher = patch('portal.apps.accounts.managers.accounts.check_user', return_value=self.mock_user)
        self.mock_check_user = self.mock_check_user_patcher.start()

        # Mock UserSystemsManager
        self.mock_systems_manager_patcher = patch('portal.apps.accounts.managers.accounts.UserSystemsManager')
        self.mock_systems_manager = self.mock_systems_manager_patcher.start()

        # Mock StorageSystem
        self.mock_storage_system_patcher = patch('portal.apps.accounts.managers.accounts.StorageSystem')
        self.mock_storage_system = self.mock_storage_system_patcher.start()

        self.addCleanup(self.mock_check_user_patcher.stop)
        self.addCleanup(self.mock_systems_manager_patcher.stop)
        self.addCleanup(self.mock_storage_system.stop)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_setup_no_preexisting(self):
        self.mock_storage_system.return_value.test.return_value = (False, None)
        setup("username", "system")
        self.mock_systems_manager.return_value.get_private_directory.assert_called_with(self.mock_user)
        self.mock_systems_manager.return_value.setup_private_system.assert_called_with(self.mock_user)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_setup_preexisting(self):
        self.mock_storage_system.return_value.test.return_value = (True, None)
        setup("username", "system")
        self.mock_systems_manager.return_value.get_private_directory.assert_called_with(self.mock_user)
        self.mock_systems_manager.return_value.setup_private_system.assert_not_called()
