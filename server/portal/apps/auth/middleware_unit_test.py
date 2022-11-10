import pytest
from tapipy.errors import BaseTapyException
import time
from datetime import timedelta
from portal.apps.auth.models import TapisOAuthToken

ROUTE = '/workbench/account/'


@pytest.fixture(autouse=True)
def configure_settings_with_middleware(settings):
    settings.MIDDLEWARE = [
        # Django core middleware.
        'django.middleware.security.SecurityMiddleware',
        'django.contrib.sessions.middleware.SessionMiddleware',
        'django.middleware.common.CommonMiddleware',
        'django.middleware.csrf.CsrfViewMiddleware',
        'django.contrib.auth.middleware.AuthenticationMiddleware',
        'django.contrib.messages.middleware.MessageMiddleware',
        'django.middleware.clickjacking.XFrameOptionsMiddleware',
        'portal.apps.auth.middleware.TapisTokenRefreshMiddleware',  #
        'impersonate.middleware.ImpersonateMiddleware'
    ]


@pytest.fixture
def authenticated_user_with_expired_token(authenticated_user):
    yield authenticated_user


@pytest.fixture
def authenticated_user_with_valid_token(authenticated_user):
    token = authenticated_user.tapis_oauth
    token.created = time.time()
    token.save()
    yield authenticated_user


@pytest.fixture()
def logout_mock(mocker):
    mock_logout_patcher = mocker.patch('portal.apps.auth.middleware.logout')
    yield mock_logout_patcher


@pytest.fixture()
def tapis_client_mock(mocker):
    mock_client = mocker.patch('portal.apps.auth.models.TapisOAuthToken.client')
    mock_client.access_token.access_token = "XYZXYZXYZ",
    mock_client.access_token.expires_in.return_value = timedelta(seconds=2000)
    yield mock_client


def test_valid_user(client, authenticated_user_with_valid_token, tapis_client_mock):
    response = client.get(ROUTE)
    assert response.status_code == 200
    assert not tapis_client_mock.client.refresh_tokens.called, 'method should not be called'


def test_expired_user(client, authenticated_user_with_expired_token, tapis_client_mock):
    response = client.get(ROUTE)
    assert response.status_code == 200
    assert tapis_client_mock.refresh_tokens.called, 'method should be called'

    # check that token is updated in model
    tapis_oauth = TapisOAuthToken.objects.filter(user=authenticated_user_with_expired_token).select_for_update().get()
    assert not tapis_oauth.expired
    assert authenticated_user_with_expired_token.tapis_oauth.created != tapis_oauth.created
    assert authenticated_user_with_expired_token.tapis_oauth.access_token != tapis_oauth.access_token
    assert authenticated_user_with_expired_token.tapis_oauth.refresh_token == tapis_oauth.refresh_token


def test_expired_user_but_refresh_error(client, authenticated_user_with_expired_token, tapis_client_mock, logout_mock):
    tapis_client_mock.refresh_tokens.side_effect = BaseTapyException
    response = client.get(ROUTE)
    assert response.status_code == 401
    assert logout_mock.called


def test_expired_user_but_unkown_error(client, authenticated_user_with_expired_token, tapis_client_mock, logout_mock):
    tapis_client_mock.refresh_tokens.side_effect = Exception
    response = client.get(ROUTE)
    assert response.status_code == 401
    assert logout_mock.called
