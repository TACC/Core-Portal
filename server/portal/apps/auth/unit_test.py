from django.test import (
    TestCase, 
    TransactionTestCase,
    Client, 
    override_settings
)
from django.contrib.auth import get_user_model
from mock import patch, MagicMock
from requests import Response
from django.conf import settings
from django.core.urlresolvers import reverse

from portal.apps.auth.tasks import setup_user
from portal.apps.auth.backends import AgaveOAuthBackend


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
        self.assertEquals(result.username, "testuser")
    
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
        self.assertEquals(result, user)
        # Existing user object should be updated
        user = get_user_model().objects.get(username="testuser")
        self.assertEquals(user.email, "test@user.com")


class TestAuthView(TestCase):
    fixtures = ['users']

    def setUp(self):
        super(TestAuthView, self).setUp()
        self.auth_state = 'fe855d4819d3cd7a19950a540be8a09a619c56ba6c9bd9f1'

    def add_auth_state_to_session(self, auth_state_value):
        session = self.client.session
        session['auth_state'] = self.auth_state
        session.save()

    @patch('portal.apps.auth.views._get_auth_state')
    def test_auth_agave(self, mock_get_auth_state):
        mock_get_auth_state.return_value = self.auth_state
        response = self.client.get("/auth/agave/", follow=False)
        agave_authorize = "{}/authorize?client_id=test&response_type=code&redirect_uri=https://testserver/auth/agave/callback/&state={}".format(
            settings.AGAVE_TENANT_BASEURL, self.auth_state)
        self.assertRedirects(response, agave_authorize, status_code=302, fetch_redirect_response=False)
        self.assertEquals(self.client.session['auth_state'], self.auth_state)

    @patch('portal.apps.auth.views.authenticate')
    @patch('portal.apps.auth.views.requests.post')
    @patch('portal.apps.auth.views.setup_user.apply_async')
    @patch('portal.apps.auth.views.new_user_setup_check')
    def test_agave_callback(self, mock_new_user_setup_check, mock_setup_user_async, mock_agave_token_post, mock_authenticate):
        self.add_auth_state_to_session(self.auth_state)

        mock_agave_token_post.return_value.json.return_value = {
            "token_type": "bearer",
            "scope": "default",
            "access_token": "4c8728a095934e10a642ad8371fcbe",
            "expires_in": 12457,
            "refresh_token": "d6ede1effb7be9c3efd7feba5f5af6"
        }
        mock_agave_token_post.return_value.status_code = 200

        mock_authenticate.return_value = get_user_model().objects.get(username="username")

        response = self.client.get("/auth/agave/callback/?state={}&code=83163624a0bc41c4a376e0acb16a62f9".format(self.auth_state))
        self.assertRedirects(response, getattr(settings, 'LOGIN_REDIRECT_URL'), status_code=302, fetch_redirect_response=False)
        self.assertEqual(mock_new_user_setup_check.call_count, 1)
        self.assertEqual(mock_setup_user_async.call_count, 1)

    def test_agave_callback_no_code(self):
        self.add_auth_state_to_session(self.auth_state)
        response = self.client.get("/auth/agave/callback/?state={}".format(self.auth_state))
        self.assertRedirects(response, reverse('portal_accounts:logout'), status_code=302, fetch_redirect_response=False)

    def test_agave_callback_mismatched_state(self):
        self.add_auth_state_to_session('foo')
        response = self.client.get("/auth/agave/callback/?state={}".format('bar'))
        self.assertEqual(response.status_code, 400)


@patch('portal.apps.accounts.managers.accounts.setup')
class TestSetupUserTask(TestCase):
    def test_setup_user(self, mock_setup):
        setup_user("username")
        mock_setup.assert_called_once_with("username")
