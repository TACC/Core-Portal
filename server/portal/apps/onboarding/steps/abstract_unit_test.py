from django.test import TestCase
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from django.db.models import signals
from django.contrib.auth import get_user_model
from portal.apps.onboarding.steps.test_steps import MockStep
import pytest


@pytest.mark.django_db(transaction=True)
class TestAbstractStep(TestCase):
    def setUp(self):
        super(TestAbstractStep, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        # Clear all prior SetupEvent objects in test db
        SetupEvent.objects.all().delete()

    def tearDown(self):
        super(TestAbstractStep, self).tearDown()

    def test_init_no_event(self):
        mock_step = MockStep(self.user)
        self.assertIsNone(mock_step.last_event)
        self.assertEqual(len(mock_step.events), 0)

    def test_step_name(self):
        mock_step = MockStep(self.user)
        self.assertEqual(
            mock_step.step_name(),
            "portal.apps.onboarding.steps.test_steps.MockStep"
        )

    def test_log(self):
        mock_step = MockStep(self.user)
        mock_step.state = SetupState.PENDING
        mock_step.log("test event")
        events = SetupEvent.objects.all().filter(user=self.user)
        self.assertEqual(events[0].message, "test event")
        self.assertEqual(events[0].state, SetupState.PENDING)

    def test_init_with_event(self):
        mock_step = MockStep(self.user)
        mock_step.state = SetupState.PENDING
        mock_step.log("event 1")
        mock_step.state = SetupState.COMPLETED
        mock_step.log("event 2")
        mock_step = MockStep(self.user)
        self.assertEqual(mock_step.last_event.state, SetupState.COMPLETED)
        self.assertEqual(len(mock_step.events), 2)

    def test_complete(self):
        mock_step = MockStep(self.user)
        mock_step.complete("Completed")
        self.assertEqual(mock_step.state, SetupState.COMPLETED)
        self.assertEqual(mock_step.last_event.state, SetupState.COMPLETED)
        self.assertEqual(
            SetupEvent.objects.all()[0].message,
            "Completed"
        )

    def test_fail(self):
        mock_step = MockStep(self.user)
        mock_step.fail("Failure")
        self.assertEqual(mock_step.state, SetupState.FAILED)
        self.assertEqual(mock_step.last_event.state, SetupState.FAILED)
        self.assertEqual(
            SetupEvent.objects.all()[0].message,
            "Failure"
        )

    def test_str(self):
        mock_step = MockStep(self.user)
        mock_step.state = SetupState.PENDING
        self.assertEqual(
            str(mock_step),
            "<portal.apps.onboarding.steps.test_steps.MockStep for test is pending>"
        )
