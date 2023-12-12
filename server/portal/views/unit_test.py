import pytest
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.http import Http404
from portal.exceptions.api import ApiException
from portal.libs.exceptions import PortalLibException
import requests
import json


# route to be used for testing purposes
API_ROUTE = '/api/system-monitor/'

# arbitrary status code that is not 403 or 404 for testing purposes
NON_403_404 = 401


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


@pytest.mark.parametrize("ExceptionClass", [requests.exceptions.HTTPError, requests.exceptions.ConnectionError])
def test_connectionerror_httperror_no_response_in_exception(ExceptionClass, client, api_method_mock):
    # testing HTTPError/ConnectionError exception that does not have a response
    # but that the status code is returned is passed on to the response
    api_method_mock.side_effect = ExceptionClass
    response = client.get(API_ROUTE)

    assert json.loads(response.content) == {'message': ''}
    assert response.status_code == 500


@pytest.mark.parametrize("ExceptionClass", [requests.exceptions.HTTPError, requests.exceptions.ConnectionError])
@pytest.mark.parametrize("status_code", [403, 404, NON_403_404])
def test_connectionerror_httperror_with_response(ExceptionClass, status_code, client, api_method_mock):
    # testing HTTPError/ConnectionError exception that does have a response
    # and that the status code + json contents are used in the response.
    # NOTE: this is important as our client code uses these status codes in reacting to tapis behavior!

    test_response = requests.Response()
    test_response._content = json.dumps({"message": "Custom error message"}).encode('utf-8')
    test_response.status_code = status_code

    api_method_mock.side_effect = ExceptionClass(response=test_response)
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': 'Custom error message'}
    assert response.status_code == status_code


@pytest.mark.parametrize("ExceptionClass", [requests.exceptions.HTTPError, requests.exceptions.ConnectionError])
@pytest.mark.parametrize("status_code", [403, 404, NON_403_404])
def test_connectionerror_httperror_non_json_content(ExceptionClass, status_code, client, api_method_mock):
    test_response = requests.Response()
    test_response._content = "Non json error content".encode('utf-8')
    test_response.status_code = status_code

    api_method_mock.side_effect = requests.exceptions.HTTPError(response=test_response)
    response = client.get(API_ROUTE)
    assert json.loads(response.content) == {'message': 'Unknown Error'}
    assert response.status_code == status_code


def test_portal_lib_exception(client, api_method_mock):
    api_method_mock.side_effect = PortalLibException
    response = client.get(API_ROUTE)
    assert response.status_code == 500
    assert json.loads(response.content) == {'message': 'Something went wrong here...'}


def test_django_exceptions_that_squash(client, api_method_mock):
    api_method_mock.side_effect = ObjectDoesNotExist
    response = client.get(API_ROUTE)
    assert response.status_code == 500
    assert json.loads(response.content) == {'message': 'Something went wrong here...'}


def test_exception(client, api_method_mock):
    api_method_mock.side_effect = Exception
    response = client.get(API_ROUTE)
    assert response.status_code == 500
    assert json.loads(response.content) == {'message': 'Something went wrong here...'}

def test_health_check(client, ):
    response = client.get('/core/health-check')
    assert response.status_code == 200
    assert json.loads(response.content) == {'status': 'healthy'}