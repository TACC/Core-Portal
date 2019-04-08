from django.test import TestCase, Client, RequestFactory, override_settings
from django.contrib.auth import get_user_model
from django.db.models import signals
from mock import Mock, patch, MagicMock, ANY

from portal.apps.onboarding.steps.test_steps import(
    MockStep,
    MockProcessingCompleteStep,
    MockProcessingFailStep,
    MockStaffStep,
    MockUserStep,
    MockWebhookStep,
    MockInvalidStepClass,
    mock_invalid_step_function
)

from portal.apps.accounts.models import PortalProfile
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.execute import (
    execute_setup_steps, 
    prepare_setup_steps,
    load_setup_step,
    log_setup_state,
    StepExecuteException
)

class TestLogSetupState(TestCase):
    def setUp(self):
        super(TestLogSetupState, self).setUp()

        # Patch the SetupEvent model, since it requires a
        # Postgres backend and the test settings use SQLite
        self.setup_event_patcher = patch('portal.apps.onboarding.execute.SetupEvent')
        self.mock_setup_event = self.setup_event_patcher.start()

    def tearDown(self):
        super(TestLogSetupState, self).tearDown()
        self.setup_event_patcher.stop()

    def test_log_setup_state_complete(self):
        # Create a test user
        test_user = get_user_model().objects.create_user('test', 'test@user.com', 'test')

        # Set the test user's setup_complete to True
        test_user.profile = PortalProfile.objects.create(user=test_user, setup_complete=True)

        log_setup_state(test_user, "test message")

        # A setup event should have been created
        self.mock_setup_event.objects.create.assert_called_with(
            user=test_user,
            step="portal.apps.onboarding.execute.execute_setup_steps",
            state=SetupState.COMPLETED,
            message="test message",
            data={ "setup_complete" : True }
        )

    def test_log_setup_state_incomplete(self):
        test_user = get_user_model().objects.create_user('test', 'test@user.com', 'test')
        test_user.profile = PortalProfile.objects.create(user=test_user, setup_complete=False)
        log_setup_state(test_user, "test message")
        self.mock_setup_event.objects.create.assert_called_with(
            user=test_user,
            step="portal.apps.onboarding.execute.execute_setup_steps",
            state=SetupState.FAILED,
            message="test message",
            data={ "setup_complete" : False }
        )

class TestPrepareSteps(TestCase):
    def setUp(self):
        super(TestPrepareSteps, self).setUp()

        # Create a test user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        # Clear all prior SetupEvent objects in test db
        SetupEvent.objects.all().delete() 

    def tearDown(self):
        super(TestPrepareSteps, self).tearDown()

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
            'portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep'
        ]
    )
    def test_prepare(self):
        prepare_setup_steps(self.user)
        setup_events = SetupEvent.objects.all()
        self.assertEqual(setup_events[0].state, SetupState.PENDING)


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
                    if event.step == \
                        "portal.apps.onboarding.steps.test_steps.MockProcessingCompleteStep" 
            ]
            self.assertEqual(len(complete_events), 3)

            # Last event should be MockPendingFailStep
            self.assertEqual(
                setup_events[-1].step, 
                "portal.apps.onboarding.steps.test_steps.MockProcessingFailStep"
            )
            self.assertEqual(setup_events[-1].state, SetupState.FAILED)