from django.conf import settings
import pytest
from django.urls import reverse


TEST_STATE = "ABCDEFG123456"

pytestmark = pytest.mark.django_db


def test_auth_agave(client, mocker):
    mocker.patch('portal.apps.auth.views._get_auth_state', return_value=TEST_STATE)

    response = client.get("/auth/agave/", follow=False)

    agave_authorize = "{}/authorize?client_id=test&response_type=code&redirect_uri=https://testserver/auth/agave/callback/&state={}".format(
        settings.AGAVE_TENANT_BASEURL, TEST_STATE)

    assert response.status_code == 302
    assert response.url == agave_authorize
    assert client.session['auth_state'] == TEST_STATE


def test_agave_callback(client, mocker, regular_user):
    mock_authenticate = mocker.patch('portal.apps.auth.views.authenticate')
    mock_agave_token_post = mocker.patch('portal.apps.auth.views.requests.post')
    mock_launch_setup_checks = mocker.patch('portal.apps.auth.views.launch_setup_checks')

    # add auth to session
    session = client.session
    session['auth_state'] = TEST_STATE
    session.save()

    mock_agave_token_post.return_value.json.return_value = {
        "token_type": "bearer",
        "scope": "default",
        "access_token": "4c8728a095934e10a642ad8371fcbe",
        "expires_in": 12457,
        "refresh_token": "d6ede1effb7be9c3efd7feba5f5af6"
    }
    mock_agave_token_post.return_value.status_code = 200
    mock_authenticate.return_value = regular_user

    response = client.get("/auth/agave/callback/?state={}&code=83163624a0bc41c4a376e0acb16a62f9".format(TEST_STATE))
    assert response.status_code == 302
    assert response.url == settings.LOGIN_REDIRECT_URL
    assert mock_launch_setup_checks.call_count == 1


def test_agave_callback_no_code(client):
    # add auth to session
    session = client.session
    session['auth_state'] = TEST_STATE
    session.save()

    response = client.get("/auth/agave/callback/?state={}".format(TEST_STATE))
    assert response.status_code == 302
    assert response.url == reverse('portal_accounts:logout')


def test_agave_callback_mismatched_state(client):
    # add auth to session
    session = client.session
    session['auth_state'] = "TEST_STATE"
    session.save()
    response = client.get("/auth/agave/callback/?state={}".format('bar'))
    assert response.status_code == 400
