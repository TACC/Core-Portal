from portal.libs.agave.utils import service_account
from django.conf import settings
from portal.libs.agave.models.systems.storage import StorageSystem
import pytest


def test_system_success(mock_tapis_client):
    storage = StorageSystem(mock_tapis_client, id="systemId", load=False)
    success, result = storage.test()
    assert success
    assert result == 'SUCCESS'


SYSTEM_LISTING_URL = "{}/files/v2/listings/system/{}/".format(settings.AGAVE_TENANT_BASEURL, "systemId")


@pytest.mark.skip(reason="not using storage system class in v3")
def test_system_failure(requests_mock):
    requests_mock.get(SYSTEM_LISTING_URL, text='Not Found', reason='Not Found', status_code=404)
    storage = StorageSystem(service_account(), id="systemId", load=False)
    success, result = storage.test()
    assert not success
    assert result == 'FAIL'


@pytest.mark.skip(reason="not using storage system class in v3")
def test_system_failure_with_json_response(requests_mock):
    json_response = {"custom_error_response_key": "value"}
    requests_mock.get(SYSTEM_LISTING_URL, json=json_response, reason='Server error', status_code=500)
    storage = StorageSystem(service_account(), id="systemId", load=False)
    success, result = storage.test()
    assert not success
    assert result == json_response
