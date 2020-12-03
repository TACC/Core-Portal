import pytest
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import Http404
from portal.exceptions.api import ApiException
from portal.libs.exceptions import PortalLibException
import requests
import json

API_ROUTE = '/api/system-monitor/'


@pytest.fixture
def api_method_mock(mocker):
    '''
    Mock of an method in our API_ROUTE to allow us to test error handling and responses
    '''
    workbench_state = mocker.patch('portal.apps.system_monitor.views.SysmonDataView.get')
    yield workbench_state


def test_unauthenticed(client, api_method_mock):
    api_method_mock.side_effect = PermissionDenied
    response = client.get(API_ROUTE)
    assert response.status_code == 403


def test_http_404(client, api_method_mock):
    api_method_mock.side_effect = Http404
    response = client.get(API_ROUTE)
    assert response.status_code == 404


def test_custom_api_exception(client, api_method_mock):
    api_method_mock.side_effect = ApiException
    response = client.get(API_ROUTE)
    assert response.status_code == 400

    api_method_mock.side_effect = ApiException(status=501, message="problem")
    response = client.get(API_ROUTE)
    assert response.status_code == 400
    result = json.loads(response.content)
    assert result == {'message': 'problem'}

    api_method_mock.side_effect = ApiException(status=404, message="problem")
    response = client.get(API_ROUTE)
    assert response.status_code == 400


def test_requests_connection_error(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['frontera.tacc.utexas.edu']

    requests_mock.get(settings.SYSTEM_MONITOR_URL, exc=requests.exceptions.HTTPError)
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': ''}
    assert response.status_code == 500

    test_response = requests.Response()
    test_response._content = json.dumps({"message": "Custom error message"}).encode('utf-8')
    test_response.status_code = 404

    requests_mock.get(settings.SYSTEM_MONITOR_URL, exc=requests.exceptions.HTTPError(response=test_response))
    response = client.get(API_ROUTE)
    assert response.status_code == 404

    test_response.status_code = 403
    requests_mock.get(settings.SYSTEM_MONITOR_URL, exc=requests.exceptions.HTTPError(response=test_response))
    response = client.get(API_ROUTE)
    assert response.status_code == 403


def test_requests_http_error(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['frontera.tacc.utexas.edu']

    requests_mock.get(settings.SYSTEM_MONITOR_URL, exc=requests.exceptions.HTTPError)
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': ''}
    assert response.status_code == 500

    test_response = requests.Response()
    test_response._content = json.dumps({"message": "Custom error message"}).encode('utf-8')
    test_response.status_code = 403

    requests_mock.get(settings.SYSTEM_MONITOR_URL,
                      exc=requests.exceptions.HTTPError(response=test_response))
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': 'Custom error message'}
    assert response.status_code == 403

    test_response.status_code = 404
    requests_mock.get(settings.SYSTEM_MONITOR_URL,
                      exc=requests.exceptions.HTTPError(response=test_response))
    response = client.get(API_ROUTE)
    assert response.status_code == 404
    assert json.loads(response.content) == {'message': 'Custom error message'}


def test_requests_http_error_non_403_or_404_with_json(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['frontera.tacc.utexas.edu']

    test_response = requests.Response()
    test_response._content = json.dumps({"message": "Custom error message"}).encode('utf-8')
    test_response.status_code = 401

    requests_mock.get(settings.SYSTEM_MONITOR_URL,
                      exc=requests.exceptions.HTTPError(response=test_response))
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': 'Custom error message'}
    assert response.status_code == 401


def test_requests_http_error_403_non_json(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['frontera.tacc.utexas.edu']

    test_response = requests.Response()
    test_response._content = "Non json error content".encode('utf-8')
    test_response.status_code = 403

    requests_mock.get(settings.SYSTEM_MONITOR_URL,
                      exc=requests.exceptions.HTTPError(response=test_response))
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': 'Unknown Error'}
    assert response.status_code == 403


def test_portal_lib_exception(client, api_method_mock):
    api_method_mock.side_effect = PortalLibException
    response = client.get(API_ROUTE)
    assert response.status_code == 500


def test_django_exceptions_that_squash(client, api_method_mock):
    api_method_mock.side_effect = ObjectDoesNotExist
    response = client.get(API_ROUTE)
    assert response.status_code == 500


def test_exception(client, api_method_mock):
    api_method_mock.side_effect = Exception
    response = client.get(API_ROUTE)
    assert response.status_code == 500
