import pytest
import time
from hashlib import sha256
from portal.apps.auth.models import TapisOAuthToken
from tapipy.tapis import Tapis


@pytest.fixture
def authenticated_user_and_setup_complete(authenticated_user, mocker):
    authenticated_user.tapis_oauth.created = time.time()
    authenticated_user.tapis_oauth.save()
    authenticated_user.profile.setup_complete = True
    authenticated_user.profile.save()

    mock_tapis = mocker.MagicMock(spec=Tapis, base_url="https://mock-tapis-api.com")

    # Patch just the client method of TapisOAuthToken as we don't want to actually check token and refresh
    mocker.patch.object(TapisOAuthToken, "client", return_value=mock_tapis)

    yield authenticated_user


def test_get_token(client, authenticated_user_and_setup_complete):
    response = client.get("/api/auth/tapis/")
    assert response.status_code == 200
    assert response.json() == {
        "token": authenticated_user_and_setup_complete.tapis_oauth.access_token,
        "baseUrl": "https://mock-tapis-api.com",
        "tapisTrackingId": f"portals.{sha256((client.session.session_key or '').encode()).hexdigest()}",
    }


def test_get_token_unauthenticated_user(client):
    response = client.get("/api/auth/tapis/")
    assert response.status_code == 302  # redirect to login


def test_get_token_setup_complete_false(client, authenticated_user_and_setup_complete):
    authenticated_user_and_setup_complete.profile.setup_complete = False
    authenticated_user_and_setup_complete.profile.save()
    response = client.get("/api/auth/tapis/")
    assert response.status_code == 403
