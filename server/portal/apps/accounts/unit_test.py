import pytest
from django.conf import settings
from unittest import mock
from django.http import HttpResponseRedirect
from portal.apps.accounts.views import LogoutView
from django.test import RequestFactory


def test_account_redirect(client):
    response = client.get('/accounts/profile/')
    assert response.status_code == 302
    assert response.url == '/workbench/account/'


@pytest.fixture
def tas_user_history_request(requests_mock, authenticated_user):
    history_url = f'{settings.TAS_URL}/v1/users/{authenticated_user.username}/history'
    requests_mock.get(history_url, json={"status": "success", "result": "dummy"})


@pytest.fixture
def tas_client(mocker):
    tas_mock = mocker.patch('portal.apps.accounts.views.TASClient', autospec=True)
    tas_client_mock = mocker.MagicMock()
    tas_client_mock.authenticate.return_value = True
    tas_mock.return_value = tas_client_mock
    yield tas_client_mock


def test_profile_data(client, tas_client, tas_user_history_request):
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 200


def test_profile_data_unauthenticated(client, tas_client):
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 302  # redirect to login


def test_profile_data_unexpected(client, tas_client, tas_user_history_request):
    tas_client.get_user.side_effect = Exception
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 500
    assert response.json() == {'message': 'Unable to get profile.'}


@pytest.fixture
def mock_user():
    class MockAccessToken:
        access_token = 'fake_token'

    class MockUser:
        tapis_oauth = MockAccessToken()
        username = 'mockuser'

    return MockUser()


@pytest.fixture
def factory():
    return RequestFactory()

@pytest.mark.django_db
@mock.patch('portal.apps.accounts.views.logout')
def test_logout_redirects_correctly_and_logs_out(mock_logout, mock_user, factory, settings):
    settings.TAPIS_TENANT_BASEURL = 'https://tapis.io'
    settings.LOGOUT_REDIRECT_URL = 'https://example.com/logout-success'

    request = factory.get('/logout')
    request.user = mock_user

    response = LogoutView().dispatch(request)

    expected_url = f"{settings.TAPIS_TENANT_BASEURL}/v3/oauth2/logout?redirect_url={settings.LOGOUT_REDIRECT_URL}"

    assert isinstance(response, HttpResponseRedirect)
    assert response.status_code == 302
    assert response.url == expected_url
    mock_logout.assert_called_once_with(request)


@mock.patch('portal.apps.accounts.views.logout')
@mock.patch('portal.apps.accounts.views.requests.post')
def test_logout_token_revoke_failure(mock_logout, requests_mock, mock_user, settings):
    with pytest.raises(Exception) as e_info:

        request = requests_mock.get('/logout/')
        request.user = mock_user

        response = LogoutView().dispatch(request)

        assert "Token revocation failed" in str(e_info.value)
        mock_logout.assert_called_once()
        assert isinstance(response, HttpResponseRedirect)
        assert response.url == str(getattr(settings, 'LOGOUT_REDIRECT_URL', '/'))
