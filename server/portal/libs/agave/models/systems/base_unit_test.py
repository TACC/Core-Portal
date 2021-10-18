from portal.libs.agave.utils import service_account
from django.conf import settings
from requests.exceptions import ConnectTimeout
from portal.libs.agave.models.systems.storage import StorageSystem
import pytest


def test_system_success(mock_agave_client):
    storage = StorageSystem(mock_agave_client, id="systemId", load=False)
    success, result = storage.test()
    assert success
    assert result == 'SUCCESS'


SYSTEM_LISTING_URL = "{}/files/v2/listings/system/{}/".format(settings.AGAVE_TENANT_BASEURL, "systemId")


def test_system_failure(requests_mock):
    requests_mock.get(SYSTEM_LISTING_URL, text='Not Found', status_code=404)
    storage = StorageSystem(service_account(), id="systemId", load=False)
    success, result = storage.test()
    assert not success
    assert result == 'FAIL'


def test_system_failure_with_json_response(requests_mock):
    json_response = {"custon_error_response_key": "value"}
    requests_mock.get(SYSTEM_LISTING_URL, json=json_response, status_code=500)
    storage = StorageSystem(service_account(), id="systemId", load=False)
    success, result = storage.test()
    assert not success
    assert result == json_response


@pytest.fixture
def logging_error_mock(mocker):
    yield mocker.patch('portal.libs.agave.models.systems.base.logging.Logger.error')


def test_system_raises_non_http_errors(requests_mock, logging_error_mock):
    with pytest.raises(ConnectTimeout):
        requests_mock.get(SYSTEM_LISTING_URL, exc=ConnectTimeout("We timed out"))
        storage = StorageSystem(service_account(), id="systemId", load=False)
        storage.test()
    logging_error_mock.assert_called_with("Test of system 'systemId' failed unexpectedly! Listing of system returned: We timed out")
