import pytest
import json
import os
from django.conf import settings


@pytest.fixture
def mock_rtutil(mocker, mock_rt):
    mocker.patch('portal.apps.tickets.utils.rtUtil.DjangoRt',
                 return_value=mock_rt)
    yield mock_rt


@pytest.fixture
def mock_rt(mocker):
    mock_rt = mocker.MagicMock()
    mock_rt.create_ticket.return_value = 1
    mock_rt.hasAccess.return_value = True
    yield mock_rt


@pytest.fixture
def get_authenticate(mocker):
    mock = mocker.patch(
            'portal.apps.request_access.api.views.TASClient.authenticate')
    mock.return_value = {}
    yield mock


@pytest.fixture
def get_authenticate_error(mocker):
    mock = mocker.patch(
            'portal.apps.request_access.api.views.TASClient.authenticate')
    mock.return_value = None
    yield mock


@pytest.fixture
def get_user(mocker):
    mock = mocker.patch(
                'portal.apps.request_access.api.views.TASClient.get_user')
    with open(os.path.join(settings.BASE_DIR,
              'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_request_access_wrong_user_password(client,
                                            regular_user,
                                            get_authenticate_error):
    response = client.post('/api/request-access/',
                           data={"problem_description":
                                 "This is the problem description",
                                 "username": "testUsername",
                                 "password": "testPassword"})
    assert response.status_code == 401


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_request_access(client,
                        regular_user,
                        mock_rtutil,
                        get_authenticate,
                        get_user):
    response = client.post('/api/request-access/',
                           data={"problem_description": "problem_description",
                                 "username": "testUsername",
                                 "password": "testPassword"})
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result['ticket_id'] == 1
    _, kwargs = mock_rtutil.create_ticket.call_args
    assert kwargs['problem_description'].startswith("problem_description")
    assert kwargs['requestor'] == "user@username.com"
    assert kwargs['subject'] == "Request Access"
    # check that some user info is added to metadata in problem_description
    assert "first_name" in kwargs['problem_description']
    assert "last_name" in kwargs['problem_description']
