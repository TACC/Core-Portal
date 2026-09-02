
from portal.apps.webhooks.models import ExternalCall
from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.webhooks.utils import (
    load_callback,
    register_webhook,
    validate_webhook,
    execute_callback
)
import pytest


pytestmark = pytest.mark.django_db


class MockCallback(WebhookCallback):
    def callback(self, external_call, webhook_request):
        assert external_call.callback_data == {"key": "value"}
        assert webhook_request == "mock_request"


class InvalidCallback(object):
    pass


def mock_invalid_function():
    pass


def test_load_callback():
    result = load_callback('portal.apps.webhooks.utils_unit_test.MockCallback')
    assert isinstance(result, MockCallback)
    with pytest.raises(ValueError):
        load_callback('portal.apps.webhooks.utils_unit_test.InvalidCallback')
    with pytest.raises(ValueError):
        load_callback('portal.apps.webhooks.utils_unit_test.mock_invalid_function')


def test_register_webhook(mock_webhook_id, regular_user):
    callback = "mock.callback.class"
    callback_data = {"key": "value"}
    result = register_webhook(callback=callback, callback_data=callback_data, user=regular_user)
    assert result == "https://testserver/webhooks/callbacks/MOCK_WEBHOOK_ID/"
    external_call = ExternalCall.objects.get(webhook_id="MOCK_WEBHOOK_ID", accepting=True)
    assert external_call is not None


def test_validate_webhook(mock_webhook_id):
    # Test if ID is missing
    assert validate_webhook("MOCK_WEBHOOK_ID") is None
    # Test if ID is present
    register_webhook()
    expected = ExternalCall.objects.all()[0]
    assert validate_webhook("MOCK_WEBHOOK_ID") == expected
    # Test if external call is no longer accepting webhooks
    expected.accepting = False
    expected.save()
    assert not ExternalCall.objects.all()[0].accepting
    assert validate_webhook("MOCK_WEBHOOK_ID") is None


def test_execute_callback():
    register_webhook(
        callback='portal.apps.webhooks.utils_unit_test.MockCallback',
        callback_data={"key": "value"}
    )
    external_callback = ExternalCall.objects.all()[0]
    execute_callback(external_callback, "mock_request")
