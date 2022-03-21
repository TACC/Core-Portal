import pytest
from django.conf import settings


@pytest.mark.django_db(transaction=True, reset_sequences=True)
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


@pytest.fixture
def tas_form_fields(mocker):
    tas = mocker.patch('portal.apps.accounts.form_fields.tas', autospec=True)
    tas.institutions.return_value = [{"id": "uniId", "name": "My University"}]
    tas.get_departments.return_value = [{"id": "departmentId", "name": "My Department"}]
    tas.countries.return_value = [{"id": "countryId", "name": "My Country"}]
    yield tas


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_profile_data(client, authenticated_user, tas_client, tas_user_history_request):
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 200


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_profile_data_unauthenticated(client, tas_client):
    response = client.get('/accounts/api/profile/data/')
    assert response.status_code == 302  # redirect to login


def test_profile_fields(client, authenticated_user, tas_form_fields):
    response = client.get('/accounts/api/profile/fields/')
    assert response.status_code == 200


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_profile_fields_unauthenticated(client):
    response = client.get('/accounts/api/profile/fields/')
    assert response.status_code == 302  # redirect to login


def test_change_password(client, authenticated_user, tas_client):
    response = client.put('/accounts/api/profile/change-password/',
                          content_type="application/json",
                          data={"newPW": "1234", "currentPW": "abcd"})
    assert response.status_code == 200
    assert response.json() == {'completed': True}


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_change_password_unauthenticated(client):
    response = client.put('/accounts/api/profile/change-password/',
                          content_type="application/json",
                          data={"newPW": "1234", "currentPW": "abcd"})
    assert response.status_code == 302  # redirect to login


def test_change_password_incorrect_password(client, authenticated_user, tas_client):
    tas_client.authenticate.return_value = False
    response = client.put('/accounts/api/profile/change-password/',
                          content_type="application/json",
                          data={"newPW": "1234", "currentPW": "abcd"})
    assert response.status_code == 401
    assert response.json() == {'message': 'Incorrect Password'}


def test_change_password_but_new_password_is_poor(client, authenticated_user, tas_client):
    e = Exception(f'Failed password change for user={authenticated_user.username}',
                  'This password does not meet the password complexity requirements.')
    tas_client.change_password.side_effect = e

    response = client.put('/accounts/api/profile/change-password/',
                          content_type="application/json",
                          data={"newPW": "1234", "currentPW": "abcd"})
    assert response.status_code == 422
    assert response.json() == {'message': 'This password does not meet the password complexity requirements.'}


def test_edit_profile_failure(client, authenticated_user, tas_client):
    # Only failed editing of profile tested.  Need additional unit test: https://jira.tacc.utexas.edu/browse/FP-1034
    response = client.put('/accounts/api/profile/edit-profile/',
                          content_type="application/json",
                          data={})  # Missing required fields
    assert response.status_code == 500
    assert response.json() == {'message': 'Unable to update profile.'}


def test_edit_profile_unauthenticated(client, tas_client):
    response = client.put('/accounts/api/profile/edit-profile/',
                          content_type="application/json",
                          data={})
    assert response.status_code == 302  # redirect to login
