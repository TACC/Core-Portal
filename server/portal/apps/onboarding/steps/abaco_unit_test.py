from django.test import (
    TestCase,
    TransactionTestCase,
    RequestFactory,
    override_settings
)
from django.contrib.auth import get_user_model
from django.db.models import signals
from mock import patch, MagicMock
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.abaco import AbacoStep
import json
import pytest

pytestmark = pytest.mark.django_db


class TestAbacoStep(TestCase):
    def setUp(self):
        super(TestAbacoStep, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        self.staff = User.objects.create_user('staff', 'staff@staff.com', 'staff')
        self.staff.is_staff = True

        SetupEvent.objects.all().delete()

    def tearDown(self):
        super(TestAbacoStep, self).tearDown()
        SetupEvent.objects.all().delete()

    def test_prepare(self):
        # Initialize and run prepare on AbacoStep
        step = AbacoStep(self.user)
        step.prepare()

        # Reload the step to see if it recalls
        step = AbacoStep(self.user)
        self.assertEqual(step.state, SetupState.STAFFWAIT)

    def test_client_action(self):
        # Create a step and request as staff
        step = AbacoStep(self.user)
        step.prepare()

        # Create a request
        request = RequestFactory().post("/api/onboarding/user/test")

        # Mock the request user as a staff member with
        # Agave OAuth
        mock_user = MagicMock()
        mock_user.username = "staff"
        mock_user.is_staff = True
        mock_user.agave_oauth = MagicMock()
        mock_client = MagicMock()
        mock_user.agave_oauth.client = mock_client
        request.user = mock_user

        mock_data = {"key": "value"}

        # Perform the "staff_confirm" action
        step.client_action("staff_confirm", mock_data, request)
        mock_client.actors.sendMessage.assert_called_with(
            actorId="3rN0bMyYj3meD",
            message={
                "username": "test",
                "step": "portal.apps.onboarding.steps.abaco.AbacoStep",
                "callback_url": "http://testserver/webhooks/onboarding/",
                "callback_secret": "dev",
                "data": mock_data
            }
        )

        # Reload the step and verify that it is in the WEBHOOK state
        step = AbacoStep(self.user)
        self.assertEqual(step.state, SetupState.WEBHOOK)

    def test_client_action_staff_deny(self):
        step = AbacoStep(self.user)
        step.prepare()

        request = RequestFactory().post("/api/onboarding/user/test")
        request.user = self.staff

        step.client_action("staff_deny", None, request)

        step = AbacoStep(self.user)
        self.assertEqual(step.state, SetupState.FAILED)

    def test_client_action_not_staff(self):
        step = AbacoStep(self.user)
        step.prepare()

        request = RequestFactory().post("/api/onboarding/user/test")
        request.user = self.user

        step.client_action("staff_confirm", None, request)

        step = AbacoStep(self.user)
        self.assertEqual(step.state, SetupState.STAFFWAIT)

    @patch('portal.apps.onboarding.steps.abaco.AbacoStep.log')
    def test_webhook_callback(self, mock_log):
        webhook_data = {
            "state": "completed",
            "message": "message",
            "data": "data"
        }
        step = AbacoStep(self.user)
        step.webhook_callback(webhook_data=webhook_data)
        mock_log.assert_called_with("message", "data")


class TestAbacoStepTransaction(TransactionTestCase):
    """
    A separate test case that allows DB transactions to be tested on
    AbacoStep
    """

    def setUp(self):
        super(TestAbacoStepTransaction, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        SetupEvent.objects.all().delete()

        # Patch execute_setup_steps
        self.mock_async_patcher = patch(
            'portal.apps.onboarding.api.webhook.execute_setup_steps'
        )
        self.mock_async = self.mock_async_patcher.start()

    def tearDown(self):
        super(TestAbacoStepTransaction, self).tearDown()
        self.mock_async.stop()
        SetupEvent.objects.all().delete()

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_make_callback(self):
        step = AbacoStep(self.user)
        step.state = SetupState.WEBHOOK
        step.log("Waiting for webhook")

        abaco_message = {
            "username": "test",
            "step": "portal.apps.onboarding.steps.abaco.AbacoStep",
            "callback_url": "http://testserver/webhooks/onboarding/",
            "callback_secret": "dev",
            "data": {
                "key": "value"
            }
        }

        # State must be one of portal.apps.onboarding.state.SetupState
        result_state = "completed"
        result_message = "Actor completed successfully"
        result_data = None

        response_message = {
            "username": abaco_message["username"],
            "step": abaco_message["step"],
            "webhook_data": {
                "state": result_state,
                "message": result_message,
                "data": result_data
            }
        }

        """
        Using requests library, this is how a production callback would function
        """
        """
        import requests

        session = requests.Session()
        session.auth = ('dev', abaco_message["callback_secret"])
        session.post(
            abaco_message["callback_url"],
            data=json.dumps(response_message)
        )
        """

        # Make a real call using the test client
        response = self.client.post(
            "/webhooks/onboarding/",
            content_type="application/json",
            data=json.dumps(response_message),
            **{"HTTP_AUTHORIZATION": "Basic: ZGV2OmRldg=="}
        )

        # Test that the webhook_call went all the way through
        self.assertEqual(response.status_code, 200)
        step = AbacoStep(self.user)
        self.assertEqual(step.last_event.state, "completed")
        self.assertEqual(step.last_event.message, "Actor completed successfully")
        self.assertEqual(step.last_event.data, result_data)
