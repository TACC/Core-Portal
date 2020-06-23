from django.test import (
    TestCase,
    override_settings
)
from django.contrib.auth import get_user_model
from django.db.models import signals
from mock import patch, ANY, MagicMock

from portal.apps.onboarding.steps.test_steps import MockProcessingCompleteStep

from portal.apps.accounts.models import PortalProfile
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.execute import (
    execute_setup_steps,
    prepare_setup_steps,
    load_setup_step,
    log_setup_state,
    new_user_setup_check,
    StepExecuteException
)
import pytest


pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_event_create(mocker):
    yield mocker.patch('portal.apps.onboarding.execute.SetupEvent.objects.create', autospec=True)


def test_log_setup_state_complete(authenticated_user, mock_event_create):
    authenticated_user.profile.setup_complete = True
    log_setup_state(authenticated_user, "test message")
    mock_event_create.assert_called_with(
        user=authenticated_user,
        step="portal.apps.onboarding.execute.execute_setup_steps",
        state=SetupState.COMPLETED,
        message="test message",
        data={"setup_complete": True}
    )


def test_log_setup_state_incomplete(authenticated_user, mock_event_create):
    authenticated_user.profile.setup_complete = False
    log_setup_state(authenticated_user, "test message")
    mock_event_create.assert_called_with(
        user=authenticated_user,
        step="portal.apps.onboarding.execute.execute_setup_steps",
        state=SetupState.FAILED,
        message="test message",
        data={"setup_complete": False}
    )


def test_prepare_setup_steps(authenticated_user, mocker, settings):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = ["TestStep"]
    mock_step = MagicMock(
        last_event=None
    )
    mock_loader = mocker.patch('portal.apps.onboarding.execute.load_setup_step')
    mock_loader.return_value = mock_step
    prepare_setup_steps(authenticated_user)
    mock_loader.assert_called_with(authenticated_user, "TestStep")
    mock_step.prepare.assert_called()


@pytest.mark.django_db(transaction=True)
class TestStepLoader(TestCase):
    def setUp(self):
        super(TestStepLoader, self).setUp()

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        # Clear all prior SetupEvent objects in test db
        SetupEvent.objects.all().delete()

    def tearDown(self):
        super(TestStepLoader, self).tearDown()

    def test_step_loader(self):
        step = load_setup_step(
            self.user,
            'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        )
        self.assertIsNotNone(step)

    def test_invalid_step_function(self):
        """
        Test an invalid configuration that passes a function instead of a class

        This may occur due to a legacy setting "portal.apps.accounts.steps.step_one"
        """
        with self.assertRaises(ValueError):
            load_setup_step(
                self.user,
                'portal.apps.onboarding.steps.test_steps.mock_invalid_step_function'
            )

    def test_invalid_step_class(self):
        """
        Test an invalid configuration that passes a class that is not
        a child of AbstractStep

        This may occur due to a legacy setting "portal.apps.accounts.steps.StepThree"
        """
        with self.assertRaises(ValueError):
            load_setup_step(
                self.user,
                'portal.apps.onboarding.steps.test_steps.MockInvalidStepClass'
            )


@pytest.mark.django_db(transaction=True)
class TestExecuteSteps(TestCase):
    def setUp(self):
        super(TestExecuteSteps, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')
        self.user.profile = PortalProfile(user=self.user)
        self.user.profile.setup_complete = False
        self.user.profile.save()

        # Clear all prior SetupEvent objects in test db
        SetupEvent.objects.all().delete()

        self.log_setup_patcher = patch('portal.apps.onboarding.execute.log_setup_state')
        self.mock_log_setup = self.log_setup_patcher.start()

    def tearDown(self):
        super(TestExecuteSteps, self).tearDown()
        self.log_setup_patcher.stop()

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    ]
    )
    def test_successful_step(self):
        """
        Test that a step that completes successfully is executed without error
        """
        prepare_setup_steps(self.user)
        execute_setup_steps(self.user.username)

        # Last event should be COMPLETED for MockPendingCompleteStep
        setup_event = SetupEvent.objects.all().filter(
            step="portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep",
            user=self.user
        ).latest("time")
        self.assertEqual(setup_event.message, "Completed")

        # After last event has completed, setup_complete should be true for user
        profile_result = PortalProfile.objects.all().filter(user=self.user)[0]
        self.assertEqual(profile_result.setup_complete, True)
        self.mock_log_setup.assert_called_with(ANY, ANY)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
        'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep',
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    ]
    )
    def test_fail_step(self):
        """
        Test that a step that fails halts execution.

        MockProcessingFailStep should invoke and leave an event,
        but MockProcessingCompleteStep (which occurs after in the mock setting)
        should not execute due to the previous step failing.
        """
        with self.assertRaises(StepExecuteException):
            prepare_setup_steps(self.user)
            execute_setup_steps(self.user.username)
            setup_events = SetupEvent.objects.all()
            self.assertEqual(len(setup_events), 2)
            setup_event = SetupEvent.objects.all()[1]
            self.assertEqual(
                setup_event.step,
                "portal.apps.onboarding.steps.test_steps.MockProcessingFailStep"
            )
            self.assertEqual(setup_event.message, "Failure")

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
        'portal.apps.onboarding.steps.test_steps.MockUserStep',
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
    ]
    )
    def test_userwait_step(self):
        """
        Test that a step in USERWAIT (or really any state that is not PENDING)
        prevents the rest of the steps from executing

        MockUserWaitStep.prepare should invoke and leave an event,
        but MockPendingCompleteStep (which occurs after in the mock setting)
        should not execute due to the first one not being "COMPLETE".
        """
        with self.assertRaises(StepExecuteException):
            prepare_setup_steps(self.user)
            execute_setup_steps(self.user.username)

        # Setup event log should not progress due to first
        # step being USERWAIT
        setup_events = SetupEvent.objects.all()
        self.assertEqual(len(setup_events), 2)
        setup_event = SetupEvent.objects.all()[1]
        self.assertEqual(
            setup_event.step,
            "portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep"
        )
        self.assertEqual(setup_event.state, SetupState.PENDING)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
        'portal.apps.onboarding.steps.test_steps.MockErrorStep'
    ]
    )
    def test_error_step(self):
        with self.assertRaises(StepExecuteException):
            prepare_setup_steps(self.user)
            execute_setup_steps(self.user.username)

        exception_event = SetupEvent.objects.all().filter(
            user=self.user,
            step='portal.apps.onboarding.steps.test_steps.MockErrorStep',
            state=SetupState.ERROR
        )[0]
        self.assertEqual(exception_event.message, "Exception: MockErrorStep")

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
        'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
    ]
    )
    def test_sequence(self):
        """
        Test that execution continues when a step completes

        MockProcessingCompleteStep should complete successfully and log an event.
        MockProcessingFailStep should execute and fail, and leave a log event.
        """
        with self.assertRaises(StepExecuteException):
            execute_setup_steps(self.user.username)
            setup_events = SetupEvent.objects.all()
            self.assertEqual(len(setup_events), 3)
            self.assertEqual(
                setup_events[0].step,
                "portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep"
            )
            self.assertEqual(setup_events[0].state, SetupState.PROCESSING)
            self.assertEqual(
                setup_events[1].step,
                "portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep"
            )
            self.assertEqual(setup_events[1].state, SetupState.COMPLETED)
            self.assertEqual(
                setup_events[2].step,
                "portal.apps.onboarding.steps.test_steps.MockProcessingFailStep"
            )
            self.assertEqual(setup_events[2].state, SetupState.FAILED)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
        'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep',
        'portal.apps.onboarding.steps.test_steps.MockProcessingFailStep'
    ]
    )
    def test_sequence_with_history(self):
        """
        Test that execution skips a previously completed step

        MockProcessingFailStep should execute and fail, and leave a log event.
        There should be two log events
        """

        # Artificially fail MockProcessingCompleteStep
        mock_complete_step = MockProcessingCompleteStep(self.user)
        mock_complete_step.fail("Mock Failure")

        # Artificially execute MockPendingCompleteStep
        # The latest event instance should be a success,
        # therefore the step should be skipped in the future
        mock_complete_step = MockProcessingCompleteStep(self.user)
        mock_complete_step.process()

        with self.assertRaises(StepExecuteException):
            execute_setup_steps(self.user.username)
            setup_events = SetupEvent.objects.all()
            self.assertEqual(len(setup_events), 3)

            # MockPendingCompleteStep should appear in the log exactly once
            complete_events = [
                event for event in SetupEvent.objects.all()
                if event.step ==
                "portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep"
            ]
            self.assertEqual(len(complete_events), 3)

            # Last event should be MockPendingFailStep
            self.assertEqual(
                setup_events[-1].step,
                "portal.apps.onboarding.steps.test_steps.MockProcessingFailStep"
            )
            self.assertEqual(setup_events[-1].state, SetupState.FAILED)


@pytest.mark.django_db(transaction=True)
class TestNewUserSetup(TestCase):
    def setUp(self):
        super(TestNewUserSetup, self).setUp()
        self.user = get_user_model().objects.create_user(
            username="testuser",
            first_name="test",
            last_name="user",
            email="test@email.com"
        )
        self.user.save()
        self.user.profile = PortalProfile(user=self.user)
        self.user.profile.save()

    def tearDown(self):
        super(TestNewUserSetup, self).tearDown()

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[])
    def test_no_setup_steps(self):
        # Assert that when there are no setup steps,
        # the setup_complete flag is True
        new_user_setup_check(self.user)
        profile = PortalProfile.objects.get(user=self.user)
        self.assertEqual(profile.setup_complete, True)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=['onboarding.step'])
    @patch('portal.apps.onboarding.execute.prepare_setup_steps')
    def test_prepare_setup_steps(self, mock_prepare):
        new_user_setup_check(self.user)
        mock_prepare.assert_called_with(self.user)
