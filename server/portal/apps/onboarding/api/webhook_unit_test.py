from django.test import TestCase, RequestFactory
from mock import patch
from django.contrib.auth import get_user_model
from django.http import (
    HttpResponseBadRequest,
    HttpResponseForbidden
)
from django.db.models import signals
from portal.apps.onboarding.api.webhook import SetupStepWebhookView
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.test_steps import MockWebhookStep
import json
import pytest
from unittest import skip

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mocked_executor(mocker):
    yield mocker.patch('portal.apps.onboarding.api.webhook.execute_setup_steps')


@pytest.fixture
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


@pytest.fixture
def webhook_request(rf):
    # Return a request post with authoriation header of
    # Basic: dev:dev (base 64 encoded)
    yield rf.post(
        "/webhooks/onboarding/",
        content_type="application/json",
        HTTP_AUTHORIZATION="Basic: ZGV2OmRldg=="
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

@skip("Need to rewrite onboarding unit tests with fixtures")
class SetupStepWebhookTest(TestCase):
    def setUp(self):
        super(SetupStepWebhookTest, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        self.webhook_step_name = "portal.apps.onboarding.steps.test_steps.MockWebhookStep"

        # Create a regular user
        User = get_user_model()
        self.user = User.objects.create_user("test", "test@user.com", "test")

        self.request_data = {
            "username": "test",
            "step": self.webhook_step_name,
            "webhook_data": {"key": "value"}
        }

        SetupEvent.objects.all().delete()
        ev = SetupEvent.objects.create(
            user=self.user,
            step="portal.apps.onboarding.steps.test_steps.MockWebhookStep",
            state=SetupState.WEBHOOK
        )
        ev.save()

        # Patch execute_setup_steps
        self.mock_async_patcher = patch(
            'portal.apps.onboarding.api.webhook.execute_setup_steps'
        )
        self.mock_async = self.mock_async_patcher.start()

        self.rf = RequestFactory()
        self.view = SetupStepWebhookView()

    def tearDown(self):
        super(SetupStepWebhookTest, self).tearDown()
        self.mock_async_patcher.stop()
        SetupEvent.objects.all().delete()

    def generate_request(self):
        # Return a request post with authoriation header of
        # Basic: dev:dev (base 64 encoded)
        return self.rf.post(
            "/webhooks/onboarding/",
            content_type="application/json",
            data=json.dumps(self.request_data),
            HTTP_AUTHORIZATION="Basic: ZGV2OmRldg=="
        )

    def test_route(self):
        response = self.client.post(
            "/webhooks/onboarding/",
            content_type="application/json",
            data=json.dumps(self.request_data),
            **{"HTTP_AUTHORIZATION": "Basic: ZGV2OmRldg=="}
        )
        self.assertEqual(response.status_code, 200)

    def test_valid_setup_webhook(self):
        # Test to see that a webhook request triggers
        # step processing and returns an OK HttpResponse
        request = self.generate_request()
        response = self.view.post(request)
        self.mock_async.apply_async.assert_called_with(args=['test'])
        self.assertEqual(response.status_code, 200)
        step = MockWebhookStep(self.user)
        self.assertEqual(step.last_event.message, "Webhook complete")

    def test_user_not_found(self):
        # If the webhook calls an unkown username, it should fail
        self.request_data["username"] = "nobody"
        request = self.generate_request()
        response = self.view.post(request)
        self.assertEqual(type(response), HttpResponseBadRequest)

    def test_step_wrong_state(self):
        # If the webhook calls a step for a user that is not in the PROCESSING
        # state, it should fail
        SetupEvent.objects.create(
            user=self.user,
            step=self.webhook_step_name,
            state=SetupState.COMPLETED
        )
        request = self.generate_request()
        response = self.view.post(request)
        self.assertEqual(type(response), HttpResponseBadRequest)

    def test_bad_password(self):
        # Test a request post with authoriation header of
        # Basic: dev:badpassword
        request = self.rf.post(
            "/webhooks/onboarding/",
            content_type="application/json",
            data=json.dumps(self.request_data),
            HTTP_AUTHORIZATION="Basic: ZGV2OmJhZHBhc3N3b3Jk"
        )
        response = self.view.post(request)
        self.assertEqual(type(response), HttpResponseForbidden)

    def test_no_password(self):
        # Test a request post with no authorization header
        request = self.rf.post(
            "/webhooks/onboarding/",
            content_type="application/json",
            data=json.dumps(self.request_data),
        )
        response = self.view.post(request)
        self.assertEqual(type(response), HttpResponseForbidden)
