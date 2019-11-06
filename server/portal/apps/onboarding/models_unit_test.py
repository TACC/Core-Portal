
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.models import SetupEvent
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.test import TestCase

class TestSetupEvent(TestCase):
    def setUp(self):
        super(TestSetupEvent, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")
        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        # Delete any remnant test data
        SetupEvent.objects.all().delete()
        event = SetupEvent.objects.create(
            user=self.user,
            state=SetupState.PENDING,
            step="TestStep",
            message="test message"
        )
        event.save()

    def tearDown(self):
        super(TestSetupEvent, self).tearDown()

    def test_model(self):
        event = SetupEvent.objects.all()[0]
        self.assertEqual(event.user, self.user)
        self.assertEqual(event.state, SetupState.PENDING)
        self.assertEqual(event.step, "TestStep")
        self.assertEqual(event.message, "test message")

    def test_unicode(self):
        event = SetupEvent.objects.all()[0]
        event_str = str(event)
        self.assertIn(self.user.username, event_str)
        self.assertIn("TestStep", event_str)
        self.assertIn(SetupState.PENDING, event_str)
        self.assertIn("test message", event_str)