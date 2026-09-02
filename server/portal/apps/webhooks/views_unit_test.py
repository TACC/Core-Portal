from portal.apps.webhooks.utils import register_webhook
from portal.apps.webhooks.callback import WebhookCallback
from django.conf import settings
import json
import pytest


pytestmark = pytest.mark.django_db


@pytest.fixture
def webhook_url():
    webhook_url = register_webhook(
        callback="portal.apps.webhooks.views_unit_test.MockCallback",
        callback_data={"key": "value"}
    )
    yield webhook_url[len(settings.VANITY_BASE_URL):]


class MockCallback(WebhookCallback):
    def callback(self, external_call, webhook_request):
        external_call.accepting = False
        external_call.save()
        assert external_call.callback_data == {"key": "value"}
        assert json.loads(webhook_request.body) == {"incoming": "data"}


def test_callback(client, webhook_url):
    response = client.post(webhook_url, {"incoming": "data"}, content_type='application/json')
    assert response.status_code == 200
    response = client.post(webhook_url, {"incoming": "data"}, content_type='application/json')
    assert response.status_code == 400
    response = client.post("/webhooks/callbacks/invalid/")
    assert response.status_code == 400
