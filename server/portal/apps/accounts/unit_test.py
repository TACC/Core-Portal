import pytest
from django.conf import settings
from django.http import HttpResponseRedirect
from django.contrib.auth import get_user


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


@pytest.mark.django_db
def test_logout_redirects_correctly_and_logs_out(client, authenticated_user, settings):
    response = client.get('/accounts/logout')

    expected_url = f"{settings.TAPIS_TENANT_BASEURL}/v3/oauth2/logout?redirect_url=https://testserver{settings.LOGOUT_REDIRECT_URL}"

    assert isinstance(response, HttpResponseRedirect)
    assert response.status_code == 302
    assert response.url == expected_url
    # Verify user is no longer logged in
    assert not get_user(client).is_authenticated
