from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.models import SetupEvent
from tapipy.errors import BaseTapyException
import pytest
import time
from datetime import timedelta
from portal.apps.auth.models import TapisOAuthToken

pytestmark = pytest.mark.django_db

ROUTE = '/workbench/account/'

@pytest.fixture
def authenticated_user_with_expired_token(authenticated_user):
    authenticated_user.tapis_oauth.expires_in = 0
    authenticated_user.tapis_oauth.save()
    yield authenticated_user


@pytest.fixture
def authenticated_user_with_valid_token(authenticated_user):
    authenticated_user.tapis_oauth.created = time.time()
    authenticated_user.tapis_oauth.save()
    yield authenticated_user


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

