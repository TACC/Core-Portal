from requests.api import request
import pytest
from django.http import HttpResponse
from django.http import HttpRequest
from portal.apps.tickets.utils import get_recaptcha_verification


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

def test_get_recaptcha_verification(mocker):
    mocker_rec=mocker.MagicMock()
    recaptchaSuccess =  {'success': True, 'challenge_ts': '2021-11-23T17:58:27Z', 'hostname': 'testkey.google.com'}
    mocker_rec.patch('https://www.google.com/recaptcha/api/siteverify', return_value=recaptchaSuccess)
    request = HttpRequest()
    request.method = 'POST'
    request.POST['recaptchaResponse'] = 'string'
    result = get_recaptcha_verification(request)
    assert result['success'] == recaptchaSuccess['success']
