import pytest
from django.conf import settings
from unittest import mock
from django.http import HttpResponseRedirect
from portal.apps.accounts.views import LogoutView


def test_account_redirect(client, authenticated_user):
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


def test_profile_data(client, authenticated_user, tas_client, tas_user_history_request):
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 200


def test_profile_data_unauthenticated(client, tas_client):
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 302  # redirect to login


def test_profile_data_unexpected(client, authenticated_user, tas_client, tas_user_history_request):
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

        def __str__(self):
            return 'mockuser'

    return MockUser()


@mock.patch('portal.apps.accounts.views.logout')
@mock.patch('portal.apps.accounts.views.requests.post')
def test_logout_success(mock_post, mock_logout, requests_mock, mock_user, settings):

    mock_post.return_value.raise_for_status.return_value = None

    request = requests_mock.get('/logout/')
    request.user = mock_user

    response = LogoutView().dispatch(request)

    mock_post.assert_called_once_with(
        f"{settings.TAPIS_TENANT_BASEURL}/v3/tokens/revoke",
        json={'token': 'fake_token'}
    )
    mock_logout.assert_called_once_with(request)
    assert isinstance(response, HttpResponseRedirect)
    assert response.url == str(getattr(settings, 'LOGOUT_REDIRECT_URL', '/'))


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


@mock.patch('portal.apps.accounts.views.requests.post')
@mock.patch('portal.apps.accounts.views.logger')
def test_revoke_token_revoke_exception_handled(mock_post, mock_logger):
    with pytest.raises(Exception):
        view = LogoutView()
        view.revoke_token("fake_token")
        mock_post.assert_called_once()
        assert mock_logger.exception.called
