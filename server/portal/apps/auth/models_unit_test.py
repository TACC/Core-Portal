import pytest
import time
from datetime import timedelta
from django.conf import settings
from portal.apps.auth.models import TapisOAuthToken

pytestmark = pytest.mark.django_db


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


@pytest.fixture
def user_without_client_mock(django_user_model, django_db_reset_sequences):
    """User fixture without the global mock_tapis_client patch.

    This fixture creates a user without that patch so we can test the actual
    Tapis() instantiation in the client property
    """
    user = django_user_model.objects.create_user(username="testuser2", password="password")
    TapisOAuthToken.objects.create(
        user=user,
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447)
    yield user


def test_client_passes_tenant_id(user_without_client_mock, mocker):
    mock_tapis = mocker.patch('portal.apps.auth.models.Tapis')
    tapis_oauth = TapisOAuthToken.objects.get(user=user_without_client_mock)
    _ = tapis_oauth.client
    mock_tapis.assert_called_once_with(
        base_url=settings.TAPIS_TENANT_BASEURL,
        tenant_id='example',
        client_id=settings.TAPIS_CLIENT_ID,
        client_key=settings.TAPIS_CLIENT_KEY,
        access_token=tapis_oauth.access_token,
        refresh_token=tapis_oauth.refresh_token,
    )

def test_valid_user(client, authenticated_user_with_valid_token):
    tapis_oauth = TapisOAuthToken.objects.filter(user=authenticated_user_with_valid_token).select_for_update().get()
    assert not tapis_oauth.expired


def test_expired_user(client, authenticated_user_with_expired_token):
    tapis_oauth = TapisOAuthToken.objects.filter(user=authenticated_user_with_expired_token).select_for_update().get()
    assert tapis_oauth.expired
