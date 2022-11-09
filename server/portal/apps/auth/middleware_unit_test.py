import pytest
from tapipy.errors import BaseTapyException
import time


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
    mock_client.refresh_tokens.return_value = {"Todo": True}
    yield mock_client


def test_valid_user(client, authenticated_user_with_valid_token, tapis_client_mock):
    response = client.get(ROUTE)
    assert response.status_code == 200
    assert not tapis_client_mock.client.refresh_tokens.called, 'method should not be called'


def test_expired_user(client, authenticated_user_with_expired_token, tapis_client_mock):
    response = client.get(ROUTE)
    assert response.status_code == 200
    assert tapis_client_mock.refresh_tokens.called, 'method should be called'


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
