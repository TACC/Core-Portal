"""Tests.

.. :module:: portal.apps.googledrive_integration.unit_test
   :synopsis: Google Drive integration app unit tests.
"""
# from django.core.urlresolvers import reverse
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from mock import MagicMock
from google.oauth2.credentials import Credentials
import pytest

import logging

logger = logging.getLogger('portal.apps.googledrive_integration.views')


@pytest.fixture
def mock_flow(mocker):
    mock_flow = mocker.patch('portal.apps.googledrive_integration.views.google_auth_oauthlib.flow')
    mock_flow.Flow.from_client_config.return_value.authorization_url.return_value = ('test_auth_url', 'test_state')
    mock_flow.Flow.from_client_config.return_value.credentials = Credentials(token='asdf', refresh_token='1234')
    yield mock_flow


@pytest.fixture
def mock_request(mocker):
    mock_request = mocker.patch('portal.apps.googledrive_integration.views.requests')
    mock_request.post.return_value = MagicMock(status_code=200)
    yield mock_request


def test_initialize(django_user_model, client, mock_flow):
    user = django_user_model.objects.create_user(username='testuser', password='testpassword')
    client.force_login(user)
    response = client.get('/accounts/applications/googledrive/initialize/')

    mock_flow.Flow.from_client_config.assert_called_with({'web': {
        "client_id": 'test',
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "client_secret": 'test'
    }}, scopes=['https://www.googleapis.com/auth/drive'])

    mock_flow.Flow.from_client_config.return_value.authorization_url.assert_called_with(access_type='offline')

    assert mock_flow.Flow.from_client_config.return_value.redirect_uri == 'https://testserver/accounts/applications/googledrive/oauth2/'
    assert response.status_code == 302
    assert response['location'] == 'test_auth_url'


def test_redirect(django_user_model, client, mock_flow):
    user = django_user_model.objects.create_user(username='testuser', password='testpassword')
    client.force_login(user)
    session = client.session
    session['googledrive'] = {'state': '12345'}
    session.save()
    response = client.get('/accounts/applications/googledrive/oauth2/', {'state': '12345'})

    user = django_user_model.objects.get(username='testuser')
    assert user.googledrive_user_token.credentials.token == 'asdf'
    assert user.googledrive_user_token.credentials.refresh_token == '1234'
    assert response.status_code == 302
    assert response['location'] == '/accounts/profile'


def test_disconnect(django_user_model, client, mock_flow, mock_request):
    # Create a user and associated Google Drive credentials
    user = django_user_model.objects.create_user(username='testuser', password='testpassword')
    credentials = Credentials(token='asdf', refresh_token='1234')
    GoogleDriveUserToken.objects.create(
        user=user,
        credentials=credentials)
    assert user.googledrive_user_token.credentials.token == 'asdf'

    # Disconnect and assert that the client is deleted.
    client.force_login(user)
    response = client.get('/accounts/applications/googledrive/disconnect/')
    user = django_user_model.objects.get(username='testuser')

    mock_request.post.assert_called_with('https://accounts.google.com/o/oauth2/revoke',
                                         params={'token': 'asdf'},
                                         headers={'content-type': 'application/x-www-form-urlencoded'})

    with pytest.raises(GoogleDriveUserToken.DoesNotExist):
        user.googledrive_user_token.credentials.token

    assert response.status_code == 302
    assert response['location'] == '/accounts/profile'
