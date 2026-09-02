import pytest
import json
import os
import io
from django.conf import settings


@pytest.fixture
def rt_tickets(scope="module"):
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/rt/tickets.json')))


@pytest.fixture
def rt_ticket_history(scope="module"):
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/rt/ticket_history.json')))


@pytest.fixture
def mock_invalid_recaptcha(requests_mock):
    recaptchaSuccess = {'success': False, 'challenge_ts': '2021-11-23T17:58:27Z', 'hostname': 'testkey.google.com'}
    requests_mock.post('https://www.google.com/recaptcha/api/siteverify', json=recaptchaSuccess)


@pytest.fixture
def mock_rt(mocker, rt_tickets, rt_ticket_history):
    mock_rt = mocker.MagicMock()
    mock_rt.getUserTickets.return_value = rt_tickets
    mock_rt.getTicketHistory.return_value = rt_ticket_history
    mock_rt.replyToTicket.return_value = True
    mock_rt.create_ticket.return_value = 1
    mock_rt.hasAccess.return_value = True
    yield mock_rt


@pytest.fixture
def mock_rtutil(mocker, mock_rt):
    mocker.patch('portal.apps.tickets.api.views.rtUtil.DjangoRt', return_value=mock_rt)
    yield mock_rt


@pytest.fixture
def mock_rtutil_no_access(mocker, mock_rt):
    mock_rt.hasAccess.return_value = False
    mocker.patch('portal.apps.tickets.api.views.rtUtil.DjangoRt', return_value=mock_rt)
    yield mock_rt


@pytest.fixture
def mock_get_matching_history_entry(mocker, rt_ticket_history):
    last_entry = rt_ticket_history[-1]
    mocker.patch('portal.apps.tickets.api.views.TicketsHistoryView._get_matching_history_entry', return_value=last_entry)


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_get(client, authenticated_user, mock_rtutil):
    response = client.get('/api/tickets/')
    assert response.status_code == 200


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_create_missing_required_description_or_subject(client, authenticated_user, mock_rtutil):
    # missing subject
    response = client.post('/api/tickets/',
                           data={"problem_description": "problem_description"})
    assert response.status_code == 400

    # missing problem_description
    response = client.post('/api/tickets/',
                           data={"subject": "subject"})
    assert response.status_code == 400


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_create_missing_required_email(client, regular_user, mock_rtutil):
    # missing user email for unauthenticated user
    response = client.post('/api/tickets/',
                           data={"problem_description": "problem_description",
                                 "subject": "subject"})
    assert response.status_code == 400


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_create(client, authenticated_user, mock_rtutil):
    response = client.post('/api/tickets/',
                           data={"problem_description": "problem_description",
                                 "subject": "subject"})
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result['ticket_id'] == 1
    _, kwargs = mock_rtutil.create_ticket.call_args
    assert len(kwargs['attachments']) == 0
    assert kwargs['problem_description'].startswith("problem_description")
    assert kwargs['requestor'] == authenticated_user.email
    assert kwargs['subject'] == "subject"
    # check that some user info is added to metadata in problem_description
    assert authenticated_user.first_name in kwargs['problem_description']
    assert authenticated_user.last_name in kwargs['problem_description']
    assert authenticated_user.username in kwargs['problem_description']


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_create_unauthencated(client, regular_user, mock_rtutil):
    response = client.post('/api/tickets/',
                           data={"problem_description": "problem_description",
                                 "email": "email@test.com",
                                 "subject": "subject",
                                 "first_name": "first_name",
                                 "last_name": "last_name"})
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result['ticket_id'] == 1
    _, kwargs = mock_rtutil.create_ticket.call_args
    assert len(kwargs['attachments']) == 0
    assert kwargs['problem_description'].startswith("problem_description")
    assert kwargs['requestor'] == "email@test.com"
    assert kwargs['subject'] == "subject"
    # check that some user info is added to metadata in problem_description
    assert "first_name" in kwargs['problem_description']
    assert "last_name" in kwargs['problem_description']


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_create_unauthencated_invalid_recaptcha(client, regular_user, mock_rtutil, mock_invalid_recaptcha):
    response = client.post('/api/tickets/',
                           data={"problem_description": "problem_description",
                                 "email": "email@test.com",
                                 "subject": "subject",
                                 "first_name": "first_name",
                                 "last_name": "last_name"}
                           )
    assert response.status_code == 400
    assert json.loads(response.content) == {'message': 'Invalid reCAPTCHA. Please try again.'}


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_create_with_attachments(client, authenticated_user, mock_rtutil):
    attachment = (io.BytesIO(b"abcdef"), 'test.jpg')
    response = client.post('/api/tickets/',
                           data={"problem_description": "problem_description",
                                 "email": "email@test.com",
                                 "cc": "cc@test.com",
                                 "subject": "subject",
                                 "first_name": "firstName",
                                 "last_name": "lastName",
                                 'attachments': attachment},
                           format="multipart")
    assert response.status_code == 200
    result = json.loads(response.content)
    assert result['ticket_id'] == 1
    _, kwargs = mock_rtutil.create_ticket.call_args
    assert len(kwargs['attachments']) == 1
    assert kwargs['problem_description'].startswith("problem_description")
    assert kwargs['requestor'] == authenticated_user.email
    assert kwargs['subject'] == "subject"
    assert kwargs['cc'] == "cc@test.com"
    # check that some user info is added to metadata in problem_description
    assert authenticated_user.first_name in kwargs['problem_description']
    assert authenticated_user.last_name in kwargs['problem_description']


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_get_history(client, authenticated_user, mock_rtutil):
    response = client.get('/api/tickets/1/history')
    assert response.status_code == 200
    result = json.loads(response.content)
    assert len(result["ticket_history"]) == 5
    full_name = "{} {}".format(authenticated_user.first_name, authenticated_user.last_name)
    assert result["ticket_history"][2]["Creator"] == full_name
    assert result["ticket_history"][3]["Creator"] == "RT System"
    assert result["ticket_history"][4]["Creator"] == full_name


@pytest.mark.django_db(transaction=True, reset_sequences=True)
@pytest.mark.parametrize("service_account", ["portal", "rtdev", "rtprod"])
def test_tickets_get_history_handle_service_accounts(service_account, client, authenticated_user, mock_rtutil, rt_ticket_history):
    for i in [6, 9]:  # two messages from service accounts
        # set to different service account
        rt_ticket_history[i]["Creator"] = service_account
    mock_rtutil.getTicketHistory.return_value = rt_ticket_history

    response = client.get('/api/tickets/1/history')
    assert response.status_code == 200
    result = json.loads(response.content)
    full_name = "{} {}".format(authenticated_user.first_name, authenticated_user.last_name)
    assert result["ticket_history"][2]["Creator"] == full_name
    assert result["ticket_history"][3]["Creator"] == "RT System"
    assert result["ticket_history"][4]["Creator"] == full_name


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_get_history_no_access(client, authenticated_user, mock_rtutil_no_access):
    response = client.get('/api/tickets/1/history')
    assert response.status_code == 403


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_post_history_reply_with_text(client, authenticated_user, mock_rtutil, mock_get_matching_history_entry):
    response = client.post('/api/tickets/1/history',
                           data={"reply": "reply text"})
    assert response.status_code == 200
    mock_rtutil.replyToTicket.assert_called_with(ticket_id=1,
                                                 files=[],
                                                 reply_text="reply text\n[Reply submitted on behalf of {}]".format(
                                                     authenticated_user.username))


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_post_history_reply_with_multiline_text(client, authenticated_user, mock_rtutil, mock_get_matching_history_entry):
    response = client.post('/api/tickets/1/history',
                           data={"reply": "reply text"})
    assert response.status_code == 200
    mock_rtutil.replyToTicket.assert_called_with(ticket_id=1,
                                                 files=[],
                                                 reply_text="reply text\n[Reply submitted on behalf of {}]".format(
                                                     authenticated_user.username))


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_post_history_reply_missing_text(client, authenticated_user, mock_rtutil):
    response = client.post('/api/tickets/1/history')
    assert response.status_code == 400


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_post_history_reply_no_access(client, authenticated_user, mock_rtutil_no_access):
    response = client.post('/api/tickets/1/history')
    assert response.status_code == 403


@pytest.mark.django_db(transaction=True, reset_sequences=True)
def test_tickets_post_history_reply_with_text_and_attachment(client, authenticated_user, mock_rtutil, mock_get_matching_history_entry):
    attachment = (io.BytesIO(b"abcdef"), 'test.jpg')
    response = client.post('/api/tickets/1/history',
                           data={"reply": "reply text",
                                 'attachments': attachment},
                           format="multipart")
    assert response.status_code == 200
    _, kwargs = mock_rtutil.replyToTicket.call_args
    assert kwargs['ticket_id'] == 1
    assert len(kwargs['files']) == 1
    assert kwargs['reply_text'] == "reply text\n[Reply submitted on behalf of {}]".format(authenticated_user.username)
