import pytest
from mock import MagicMock
from portal.apps.auth.models import AgaveOAuthToken
from portal.apps.accounts.models import PortalProfile


@pytest.fixture
def mock_agave_client(mocker):
    yield mocker.patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)


@pytest.fixture
def mock_googledrive_client(mocker):
    from googleapiclient.discovery import Resource
    return MagicMock()


@pytest.fixture
def regular_user(django_user_model, django_db_reset_sequences, mock_agave_client):
    django_user_model.objects.create_user(username='username', password='password')
    user = django_user_model.objects.get(username='username')
    token = AgaveOAuthToken.objects.create(
        user=user,
        token_type="bearer",
        scope="default",
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447)
    token.save()
    profile = PortalProfile.objects.create(user=user)
    profile.save()
    user.save()
    yield user


@pytest.fixture
def regular_user2(django_user_model, django_db_reset_sequences, mock_agave_client):
    django_user_model.objects.create_user(username='username2', password='password')
    user = django_user_model.objects.get(username='username2')
    token = AgaveOAuthToken.objects.create(
        user=user,
        token_type="bearer",
        scope="default",
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447)
    token.save()
    profile = PortalProfile.objects.create(user=user)
    profile.save()
    user.save()
    yield user


@pytest.fixture
def authenticated_user(client, regular_user):
    client.force_login(regular_user)
    yield regular_user


@pytest.fixture
def staff_user(client, django_user_model, django_db_reset_sequences, mock_agave_client):
    django_user_model.objects.create_user(username='staff', password='password')
    user = django_user_model.objects.get(username='staff')
    user.is_staff = True
    token = AgaveOAuthToken.objects.create(
        user=user,
        token_type="bearer",
        scope="default",
        access_token="1234fsf",
        refresh_token="123123123",
        expires_in=14400,
        created=1523633447)
    token.save()
    profile = PortalProfile.objects.create(user=user)
    profile.save()
    user.save()
    yield user


@pytest.fixture
def authenticated_staff(client, staff_user):
    client.force_login(staff_user)
    return staff_user
