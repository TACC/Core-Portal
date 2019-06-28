"""Tests.

.. :module:: portal.apps.googledrive_integration.unit_test
   :synopsis: Google Drive integration app unit tests.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model, signals
from django.core.urlresolvers import reverse
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from mock import patch, MagicMock
from google.oauth2.credentials import Credentials
from requests import Response

import logging

logger = logging.getLogger('portal.apps.googledrive_integration.views')


class TestGoogleDriveInitialization(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        self.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        self.mock_client = self.mock_client_patcher.start()
        user = get_user_model().objects.get(username='username')
        self.client.force_login(user)

    def tearDown(self):
        self.mock_client_patcher.stop()

    def test_index_view_not_enabled(self):
        """
        Should render as not enabled
        """

        response = self.client.get(reverse('googledrive_integration:index'))
        self.assertContains(response, 'Google Drive NOT Enabled')

    def test_initialize_token_view(self):
        """
        Should respond with a 302 to Google Drive OAuth
        """

        response = self.client.get(reverse('googledrive_integration:initialize_token'))
        self.assertEqual(response.status_code, 302)
        self.assertIn('https://accounts.google.com/o/oauth2/auth',
                      response['Location'])

    @patch('portal.apps.googledrive_integration.models.GoogleDriveUserToken.client')
    @patch('google_auth_oauthlib.flow.Flow')
    def test_oauth2_callback(self, m_google_oauth_flow, m_googledrive_client):
        """
        Tests the Google OAuth2 Callback handler. After completing the OAuth auth code flow,
        the user has a GoogleDriveUserToken and Credentials object and calls can be made
        to the Google Drive API on the user's behalf.

        Args:
            m_google_oauth_flow: mock for google auth Flow
            m_googledrive_client: mock for GoogleDriveUserToken client
        """

        session = self.client.session
        session['googledrive'] = {
            'state': 'googledrive_csrf_state_123'
        }
        session.save()

        # patch return_values
        m_google_oauth_flow.from_client_config.return_value.credentials = Credentials(
            token='asdf', refresh_token='1234')

        response = self.client.get(reverse('googledrive_integration:oauth2_callback'),
                                   {'code': 'googledrive_authorization_code_123',
                                    'state': 'googledrive_csrf_state_123'
                                    })

        self.assertRedirects(response, reverse('googledrive_integration:index'),
                             fetch_redirect_response=False)

        user = get_user_model().objects.get(username='username')
        self.assertEqual('asdf', user.googledrive_user_token.credentials.token)
        self.assertEqual('1234', user.googledrive_user_token.credentials.refresh_token)

        m_googledrive_client.about.return_value.get.return_value.execute.return_value = {'user': {
            'displayName': 'First Name Last Name',
            'emailAddress': 'username@server.com'
        }}
        response = self.client.get(reverse('googledrive_integration:index'))
        self.assertContains(response, 'Google Drive Enabled')
        self.assertContains(response, 'Google Drive as <em>First Name Last Name (username@server.com)</em>')


class TestGoogleDriveDisconnect(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        self.user = get_user_model().objects.get(username='username')
        self.client.force_login(self.user)

    @patch('requests.post')
    def test_disconnect(self, mock_revoke_post):
        """
        Test disconnecting Google Drive.
        """
        token = GoogleDriveUserToken(user=self.user, credentials=Credentials(
            token='asdf', refresh_token='1234'))
        token.save()

        # verify we have preconditions
        self.assertIsNotNone(self.user.googledrive_user_token)
        resp = Response()
        resp.status_code = 200
        mock_revoke_post.return_value = resp

        # verify we can render the view
        response = self.client.get(reverse('googledrive_integration:disconnect'))
        self.assertEqual(response.status_code, 200)

        # confirm disconnect request
        response = self.client.post(reverse('googledrive_integration:disconnect'), follow=True)
        mock_revoke_post.called_once()

        # confirm redirects to index template
        self.assertRedirects(response, reverse('googledrive_integration:index'),
                             fetch_redirect_response=False)
        self.assertTemplateUsed(response, 'portal/apps/googledrive_integration/index.html')

        # verify related objects were deleted
        self.assertRaises(GoogleDriveUserToken.DoesNotExist,
                          GoogleDriveUserToken.objects.get, user=self.user)

    def test_disconnect_no_token(self):

        self.assertRaises(GoogleDriveUserToken.DoesNotExist, GoogleDriveUserToken.objects.get, user=self.user)

        with patch.object(logger, 'warn') as mock_warn:
            response = self.client.post(reverse('googledrive_integration:disconnect'), follow=False)

            mock_warn.assert_called_once_with('Disconnect Google Drive; GoogleDriveUserToken does not exist.',
                                                        extra={'user': self.user})
            self.assertRedirects(response, reverse('googledrive_integration:index'),
                                fetch_redirect_response=False)

    @patch('requests.post')
    def test_disconnect_exception(self, mock_revoke_post):
        token = GoogleDriveUserToken(user=self.user, credentials=Credentials(
            token='asdf', refresh_token='1234'))
        token.save()

        mock_revoke_post.side_effect = Exception('Mock Unknown Exception')

        with patch.object(logger, 'exception') as mock_exception:
            response = self.client.post(reverse('googledrive_integration:disconnect'), follow=False)
            mock_exception.assert_called_once_with('google drive delete error: Mock Unknown Exception')
            self.assertRedirects(response, reverse('googledrive_integration:index'),
                                fetch_redirect_response=False)
            token.delete()

    @patch('requests.post')
    def test_disconnect_bad_status_code(self, mock_revoke_post):
        token = GoogleDriveUserToken(user=self.user, credentials=Credentials(
            token='asdf', refresh_token='1234'))
        token.save()

        resp = Response()
        resp.status_code = 500
        mock_revoke_post.return_value = resp

        with patch.object(logger, 'debug') as mock_debug:
            response = self.client.post(
                reverse('googledrive_integration:disconnect'), follow=False)

            mock_revoke_post.called_once()
            mock_debug.assert_called_once_with('status code:{}'.format(resp.status_code))

            self.assertRedirects(response, reverse('googledrive_integration:index'),
                                fetch_redirect_response=False)

            self.assertRaises(GoogleDriveUserToken.DoesNotExist,
                                    GoogleDriveUserToken.objects.get, user=self.user)
        

class TestGoogleDriveUserTokenModel(TestCase):
    fixtures = ['users']

    def test_model(self):
        test_user = get_user_model().objects.get(username='username')
        token = GoogleDriveUserToken(
            user=test_user,
            credentials=Credentials(token='asdf', refresh_token='1234')
        )
        token.save()

        self.assertEquals(test_user.googledrive_user_token, token)
