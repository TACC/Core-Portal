from django.test import RequestFactory
from django.http import (
    HttpResponseBadRequest,
)
from portal.apps.onboarding.api.webhook import SetupStepWebhookView
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.test_steps import MockWebhookStep
import json
import pytest

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mocked_executor(mocker):
    yield mocker.patch('portal.apps.onboarding.api.webhook.execute_setup_steps')


@pytest.fixture(autouse=True)
def mock_webhook_step(regular_user):
    ev = SetupEvent.objects.create(
        user=regular_user,
        step="portal.apps.onboarding.steps.test_steps.MockWebhookStep",
        state=SetupState.WEBHOOK
    )
    ev.save()
    yield ev


@pytest.fixture
def webhook_request_data():
    yield {
        "username": "username",
        "step": "portal.apps.onboarding.steps.test_steps.MockWebhookStep",
        "webhook_data": {"key": "value"}
    }


def generate_request(request_data):
    # Return a request post with authoriation header of
    # Basic: dev:dev (base 64 encoded)
    return RequestFactory().post(
        "/webhooks/onboarding/",
        content_type="application/json",
        HTTP_AUTHORIZATION="Basic: ZGV2OmRldg==",
        data=json.dumps(request_data)
    )


def test_route(client, mock_webhook_step, webhook_request_data):
    """
    Test the route to see that the HTTP Basic Auth works
    """
    response = client.post(
        "/webhooks/onboarding/",
        content_type="application/json",
        data=json.dumps(webhook_request_data),
        **{"HTTP_AUTHORIZATION": "Basic: ZGV2OmRldg=="}
    )
    assert response.status_code == 200


def test_bad_password(client, webhook_request_data):
    # Test a request post with authoriation header of
    # Basic: dev:badpassword
    response = client.post(
        "/webhooks/onboarding/",
        content_type="application/json",
        data=json.dumps(webhook_request_data),
        **{"HTTP_AUTHORIZATION": "Basic: ZGV2OmJhZHBhc3N3b3Jk"}
    )
    assert response.status_code == 403


def test_no_password(client, webhook_request_data):
    # Test a request post with no authorization header
    response = client.post(
        "/webhooks/onboarding/",
        content_type="application/json",
        data=json.dumps(webhook_request_data),
        **{"HTTP_AUTHORIZATION": "Basic: ZGV2OmJhZHBhc3N3b3Jk"}
    )
    assert response.status_code == 403


def test_valid_setup_webhook(mocked_executor, webhook_request_data, regular_user):
    # Test to see that a webhook request triggers
    # step processing and returns an OK HttpResponse
    view = SetupStepWebhookView()
    request = generate_request(webhook_request_data)
    response = view.post(request)
    mocked_executor.apply_async.assert_called_with(args=['username'])
    assert response.status_code == 200
    step = MockWebhookStep(regular_user)
    assert step.last_event.message == "Webhook complete"


def test_user_not_found(webhook_request_data):
    view = SetupStepWebhookView()
    webhook_request_data["username"] = "nobody"
    request = generate_request(webhook_request_data)
    response = view.post(request)
    assert type(response) == HttpResponseBadRequest


def test_step_wrong_state(mock_webhook_step, webhook_request_data):
    view = SetupStepWebhookView()
    # If the webhook calls a step for a user that is not in the PROCESSING
    # state, it should fail
    mock_webhook_step.state = SetupState.COMPLETED
    mock_webhook_step.save()

    request = generate_request(webhook_request_data)
    response = view.post(request)
    assert type(response) == HttpResponseBadRequest
