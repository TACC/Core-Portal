from django.test import (
    TestCase, 
    TransactionTestCase,
    Client, 
    RequestFactory, 
    override_settings
)
from django.contrib.auth import get_user_model
from mock import Mock, patch, MagicMock, ANY
from portal.apps.auth.backends import AgaveOAuthBackend
from requests import Response
from core_apps_accounts.models import PortalProfile
import pytest

pytestmark = pytest.mark.django_db


class TestAgaveOAuthBackend(TransactionTestCase):
    def setUp(self):
        super(TestAgaveOAuthBackend, self).setUp()
        self.backend = AgaveOAuthBackend()
        self.mock_response = MagicMock(autospec=Response)
        self.mock_requests_patcher = patch(
            'portal.apps.auth.backends.requests.get',
            return_value=self.mock_response
        )
        self.mock_requests = self.mock_requests_patcher.start()

    def tearDown(self):
        super(TestAgaveOAuthBackend, self).tearDown()
        self.mock_requests_patcher.stop()

    def test_bad_backend_params(self):
        # Test backend authenticate with no params
        result = self.backend.authenticate()
        self.assertIsNone(result)
        # Test AgaveOAuthBackend if params do not indicate agave
        result = self.backend.authenticate(backend='not_agave')
        self.assertIsNone(result)

    def test_bad_response_status(self):
        # Test that backend failure responses are handled

        # Mock different return values for the backend response
        self.mock_response.json.return_value = { }
        result = self.backend.authenticate(backend='agave', token='1234')
        self.assertIsNone(result)
        self.mock_response.json.return_value = { "status" : "failure" }
        result = self.backend.authenticate(backend='agave', token='1234')
        self.assertIsNone(result)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_new_user(self):
        # Test that a new user is created and returned
        self.mock_response.json.return_value = {
            "status" : "success",
            "result" : {
                "username" : "testuser",
                "first_name" : "test",
                "last_name" : "user",
                "email" : "test@user.com"
            }
        }
        result = self.backend.authenticate(backend='agave', token='1234')
        self.assertEqual(result.username, "testuser")
    
    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_update_existing_user(self):
        # Test that an existing user's information is
        # updated with from info from the Agave backend response

        # Create a pre-existing user with the same username
        user = get_user_model().objects.create_user(
            username="testuser",
            first_name="test",
            last_name="user",
            email="old@email.com"
        )
        user.save()
        self.mock_response.json.return_value = {
            "status" : "success",
            "result" : {
                "username" : "testuser",
                "first_name" : "test",
                "last_name" : "user",
                "email" : "test@user.com"
            }
        }
        result = self.backend.authenticate(backend='agave', token='1234')
        # Result user object should be the same
        self.assertEqual(result, user)
        # Existing user object should be updated
        user = get_user_model().objects.get(username="testuser")
        self.assertEqual(user.email, "test@user.com")