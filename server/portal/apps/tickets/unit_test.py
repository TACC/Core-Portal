import pytest
from django.http import HttpResponse
from django.http import HttpRequest
from portal.apps.tickets.utils import get_recaptcha_verification
from portal.apps.tickets import rtUtil


@pytest.fixture(autouse=True)
def mock_render(mocker):
    yield mocker.patch('portal.apps.tickets.views.render', return_value=HttpResponse("OK"))


def test_tickets_get(client, authenticated_user):
    response = client.get('/tickets/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/'


def test_ticket_create_authenticated(client, regular_user):
    """Users who are setup_complete may use workbench/dashboard routes
    """
    regular_user.profile.setup_complete = True
    regular_user.profile.save()
    client.force_login(regular_user)
    response = client.get('/tickets/new/')
    assert response.status_code == 302
    assert response.url == '/workbench/dashboard/tickets/create/'


def test_ticket_create_authenticated_setup_incomplete(client, regular_user):
    """Users who are not setup_complete should not be redirected
    to the /workbench/dashboard route, because the setup_complete
    middleware would redirect them to the onboarding view
    """
    regular_user.profile.setup_complete = False
    regular_user.profile.save()
    client.force_login(regular_user)
    response = client.get('/tickets/new/')
    assert response.status_code == 200


def test_get_recaptcha_verification(mocker, requests_mock, regular_user):
    recaptchaSuccess = {'success': True, 'challenge_ts': '2021-11-23T17:58:27Z', 'hostname': 'testkey.google.com'}
    requests_mock.post('https://www.google.com/recaptcha/api/siteverify', json=recaptchaSuccess)
    request = HttpRequest()
    request.method = 'POST'
    request.POST['recaptchaResponse'] = 'string'
    result = get_recaptcha_verification(request)
    assert result['success'] == recaptchaSuccess['success']


class RtUtilTestable(rtUtil.DjangoRt):
    '''
    Tester for rtUtil.DjangoRt.
    '''

    def __init__(self, tracker):
        # Set the attributes directly
        self.rtHost = 'mock_host'
        self.rtUn = 'mock_rt_user'
        self.rtPw = 'mock_pw'
        self.rtQueue = ''
        self.tracker = tracker


@pytest.fixture
def rt_ticket(request):
    return request.param


@pytest.fixture
def mock_tracker(mocker, rt_ticket):
    mock_tracker = mocker.MagicMock()
    mock_tracker.get_ticket.return_value = rt_ticket
    yield mock_tracker


@pytest.mark.parametrize('rt_ticket', [
    {'id': 1, 'Requestors': ["UserName1@Example.COM", "Username2@Example.com"], 'Cc': []},
    {'id': 1, 'Requestors': "UserName1@Example.COM,Username2@Example.com", 'Cc': []},
    {'id': 1, 'Requestors': ["username1@example.com", "username2@example.com"], 'Cc': []}], indirect=True)
def test_rt_hasaccess_requestors_or_cc(mock_tracker):
    rtTester = RtUtilTestable(mock_tracker)
    assert rtTester.hasAccess(1, 'Username1@Example.com') is True
    assert rtTester.hasAccess(1, 'Username2@Example.com') is True


@pytest.mark.parametrize('rt_ticket', [
    {'id': 1, 'Requestors': ["Foo@example.com"], 'Cc': ["UserName1@Example.COM", "username2@example.com"]},
    {'id': 1, 'Requestors': ["Foo@example.com"], 'Cc': "UserName1@Example.COM,username2@example.com"},
    {'id': 1, 'Requestors': ["Foo@example.com"], 'Cc': ["username1@example.com", "username2@example.com"]},
    {'id': 1, 'Cc': ["username1@example.com", "username2@example.com"]},
    {'id': 1, 'Requestors': [], 'Cc': ["username1@example.com", "username2@example.com"]}], indirect=True)
def test_rt_hasaccess_cc(mock_tracker):
    rtTester = RtUtilTestable(mock_tracker)
    assert rtTester.hasAccess(1, 'Username1@Example.com') is True
    assert rtTester.hasAccess(1, 'Username2@Example.com') is True


@pytest.mark.parametrize('rt_ticket', [
    {'id': 1, 'Requestors': ["foo@example.com"], 'Cc': ["baz@example.com"]},
    {'id': 1, 'Requestors': ["FOO@example.com"], 'Cc': ["BAZ@example.com"]},
    {'id': 1},
    {'id': 1, 'Requestors': [], 'Cc': []}], indirect=True)
def test_rt_hasnoaccess(mock_tracker):
    rtTester = RtUtilTestable(mock_tracker)
    assert rtTester.hasAccess(1, 'Username1@Example.com') is False
