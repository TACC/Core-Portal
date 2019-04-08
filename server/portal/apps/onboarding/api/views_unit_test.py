from django.test import TestCase, Client, RequestFactory, override_settings
from mock import Mock, patch, MagicMock, ANY
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.core.exceptions import PermissionDenied
from django.http import (
    Http404,
    JsonResponse, 
    HttpResponse,
    HttpResponseBadRequest,
    HttpResponseForbidden
)

import json

from portal.apps.auth.models import AgaveOAuthToken
from portal.apps.accounts.models import PortalProfile
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.steps.test_steps import (
    MockStep,
    MockProcessingCompleteStep,
    MockProcessingFailStep,
    MockStaffStep,
    MockUserStep,
    MockWebhookStep
)

from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.api.views import (
    SetupStepView,
    SetupAdminView
)

class TestSetupStepView(TestCase):
    @classmethod
    def setUpClass(cls):
        # Mock Agave OAuth Token validation
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

        # Mock asynchronous step executor
        cls.mock_execute_patcher = patch(
            'portal.apps.onboarding.api.views.execute_setup_steps'
        )
        cls.mock_execute = cls.mock_execute_patcher.start()
        cls.mock_execute.apply_async = MagicMock()

        cls.rf = RequestFactory()
        cls.view = SetupStepView()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()
        cls.mock_execute_patcher.stop()

    def setUp(self):
        # Create a regular user
        super(TestSetupStepView, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        # Create a regular user
        User = get_user_model()
        self.user = User.objects.create_user("test", "test@user.com", "test")
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = self.user
        token.save()
        self.user.profile = PortalProfile.objects.create(user=self.user)
        self.user.profile.setup_complete = False
        self.user.profile.save()
        self.user.save()

        # Create a staff user
        self.staff = User.objects.create_user("staff", "staff@user.com", "staff")
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = self.staff
        token.save()
        self.staff.is_staff = True
        self.staff.save()

        # Clear previous SetupEvents
        SetupEvent.objects.all().delete()

        # Create some setup events for the regular user
        SetupEvent.objects.create(
            user=self.user,
            step="portal.apps.onboarding.steps.test_steps.MockStep",
            state="pending",
            message="message"
        ).save()
        
        SetupEvent.objects.create(
            user=self.user,
            step="portal.apps.onboarding.steps.test_steps.MockStep",
            state=SetupState.COMPLETED,
            message="message",
        ).save()

        self.mock_step_loader_patcher = patch(
            'portal.apps.onboarding.api.views.load_setup_step'
        )
        self.mock_step_loader = self.mock_step_loader_patcher.start()
        self.mock_step_loader.return_value = MockStep(self.user)

        # Mock log_setup_state due to test DB incompatibility
        self.log_setup_patcher = patch(
            'portal.apps.onboarding.api.views.log_setup_state'
        )
        self.mock_log_setup = self.log_setup_patcher.start()

        # Magic Mocked step
        self.mock_step = MagicMock()
        self.mock_step.log = MagicMock()

        # Test instance
        self.view = SetupStepView()

    def tearDown(self):
        super(TestSetupStepView, self).tearDown()
        self.mock_step_loader_patcher.stop()
        self.mock_log_setup.stop()

    def test_get_user_parameter(self):
        request = RequestFactory().get("/api/onboarding/user/test")
        request.user = self.user

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
            'portal.apps.onboarding.steps.test_steps.MockStep'
        ]
    )
    def test_get_user_as_user(self):
        # A user should be able to retrieve their own setup event info
        self.client.login(username='test', password='test')
        response = self.client.get("/api/onboarding/user/test", follow=True)
        result = response.json()

        # Make sure result json is correct. Can't compare to 
        # a fixture because timestamps will be different
        self.assertEqual(result["username"], "test")
        self.assertEqual(result["email"], "test@user.com")
        self.assertFalse(result["isStaff"])
        self.assertIn("steps", result)
        self.assertFalse(result["setupComplete"])
        self.assertEqual(
            result["steps"][0]["step"], 
            "portal.apps.onboarding.steps.test_steps.MockStep"
        )
        self.assertEqual(
            result["steps"][0]["displayName"],
            "Mock Step"
        )
        self.assertEqual(
            result["steps"][0]["state"], 
            SetupState.COMPLETED
        )
        self.assertEqual(len(result["steps"][0]["events"]), 2)

    @override_settings(PORTAL_USER_ACCOUNT_SETUP_STEPS=[
            'portal.apps.onboarding.steps.test_steps.MockStep'
        ]
    )
    def test_get_user_as_staff(self):
        self.client.login(username='staff', password='staff')
        response = self.client.get("/api/onboarding/user/test", follow=True)
        result = response.json()

        # Make sure result json is correct.
        self.assertEqual(result["username"], "test")
        self.assertIn("steps", result)
        self.assertEqual(len(result["steps"][0]["events"]), 2)

    def test_forbidden(self):
        self.client.login(username='test', password='test')     
        response = self.client.get("/api/onboarding/user/invalid/", follow=True) 
        # This raises an error, which is caught and converted
        # into a 500 by portal.views.base
        self.assertNotEqual(response.status_code, 200)

    def test_not_found(self):
        self.client.login(username='staff', password='staff')
        response = self.client.get("/api/onboarding/user/invalid/", follow=True)
        self.assertNotEqual(response.status_code, 200)

    def test_incomplete_post(self):
        # post should return HttpResponseBadRequest if fields are missing
        request = self.rf.post(
            "/api/onboarding/user/test",
            content_type="application/json",
            data=json.dumps({ "action" : "user_confirm" })
        )
        request.user = self.user
        response = self.view.post(request, "test")
        self.assertEqual(type(response), HttpResponseBadRequest)

        request = self.rf.post(
            "/api/onboarding/user/test",
            content_type="application/json",
            data=json.dumps({ "step" : "setupstep" })
        )
        request.user = self.user
        response = self.view.post(request, "test")
        self.assertEqual(type(response), HttpResponseBadRequest)

    def test_client_action(self):
        # TODO: This fails
        self.mock_step.prepare = MagicMock()
        request = MagicMock()
        request.user = self.user
        self.view.client_action(
            request, 
            self.mock_step, 
            "user_confirm", 
            None
        )
        self.mock_step.client_action.assert_called_with(
            "user_confirm",
            None,
            request
        )

    def test_reset_not_staff(self):
        # A user should not be able to perform the reset action
        with self.assertRaises(PermissionDenied):
            request = MagicMock()
            request.user = self.user
            self.mock_step.state = SetupState.COMPLETED
            self.view.reset(request, self.mock_step)
            self.mock_step.log.assert_not_called()

    def test_reset(self):
        # The reset function should call prepare on a step
        # and flag the user's setup_complete as False
        request = MagicMock()
        request.user = self.staff
        self.mock_step.prepare = MagicMock()
        self.view.reset(request, self.mock_step)
        self.mock_step.prepare.assert_called_with()
        self.mock_step.log.assert_called_with(ANY)
        self.mock_log_setup.assert_called_with(ANY, ANY)
        self.assertEqual(self.mock_step.user.profile.setup_complete, False)

    def test_complete_not_staff(self):
        with self.assertRaises(PermissionDenied):
            request = MagicMock()
            request.user = self.user
            self.mock_step.state = SetupState.FAILED
            self.view.complete(request, self.mock_step)
            self.mock_step.log.assert_not_called()

    def test_complete(self):
        request = self.rf.post(
            "/api/onboarding/user/test", 
            content_type='application/json',
            data=json.dumps({
                "action" : "complete",
                "step" : "portal.apps.onboarding.steps.test_steps.MockStep"
            })
        )
        request.user = self.staff
        response = self.view.post(request, "test")

        # set_state should have put MockStep in COMPLETED, as per request
        events = [ event for event in SetupEvent.objects.all() ]
        self.assertEqual(
            events[-1].step, 
            "portal.apps.onboarding.steps.test_steps.MockStep"
        )
        self.assertEqual(events[-1].state, SetupState.COMPLETED)

        # execute_setup_steps should have been run
        self.mock_execute.apply_async.assert_called_with(args=[ self.user.username ])
        last_event = json.loads(response.content)
        self.assertEqual(last_event["state"], SetupState.COMPLETED) 
        
class TestSetupAdminViews(TestCase):
    @classmethod
    def setUpClass(cls):
        super(TestSetupAdminViews, cls).setUpClass()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")
        
        cls.User = get_user_model()
        cls.factory = RequestFactory()
        cls.view = SetupAdminView()

        # Clear other users
        cls.User.objects.all().delete()

        # Create a test user
        a_user = cls.User.objects.create_user("a_user", "a@user.com", "apassword")
        a_user.last_name = "a"
        a_user.first_name = "user"
        a_user.save()
        a_user_profile = PortalProfile(user=a_user)
        a_user.profile.setup_complete = True
        a_user_profile.save()
        
        # Create users with setup_complete == False
        c_user = cls.User.objects.create_user("c_user", "c@user.com", "cpassword")
        c_user.last_name = "c"
        c_user.first_name = "user"
        c_user_profile = PortalProfile(user=c_user)
        c_user.profile.save()
        c_user.save()

        b_user = cls.User.objects.create_user("b_user", "b@user.com", "bpassword")
        b_user.last_name = "b"
        b_user.first_name = "user"
        b_user_profile = PortalProfile(user=b_user)
        b_user.profile.save()
        b_user.save()

        # User with no Profile. Sometimes these exist (wma_prtl I'm looking at you) and
        # the view should not return them
        no_profile_user = cls.User.objects.create_user("no_profile_user", "no@user.com", "nopassword")
        no_profile_user.last_name = "no"
        no_profile_user.first_name = "user"
        no_profile_user.save()

    @classmethod
    def tearDownClass(cls):
        super(TestSetupAdminViews, cls).tearDownClass()
        pass

    def setUp(self):
        # Create a staff user and login as that user to test routes
        self.admin_user = self.User.objects.create_user('testadmin', 'test@admin.com', 'admin_password')
        self.admin_user.is_staff = True
        self.admin_user.save()
        self.client.login(username='testadmin', password='admin_password')

    def test_user_fixtures(self):
        a_user = self.User.objects.get(username="a_user")
        self.assertIsNotNone(a_user)
        self.assertTrue(a_user.profile.setup_complete)
        b_user = self.User.objects.get(username="b_user")
        self.assertIsNotNone(b_user)
        self.assertFalse(b_user.profile.setup_complete)
        c_user = self.User.objects.get(username="c_user")
        self.assertIsNotNone(c_user)
        self.assertFalse(c_user.profile.setup_complete)

    def test_admin_route(self):
        # Integration test for route
        # If the user is authenticated and is_staff, then the route should 
        # return a JsonResponse
        resp = self.client.get("/api/onboarding/admin/", follow=False)
        self.assertEqual(type(resp), JsonResponse)

    def test_admin_route_is_protected(self):
        # Integration test to make sure route is protected
        # If the user is not staff, then the route should return a redirect
        self.non_admin = self.User.objects.create_user('testuser', 'test@user.com', 'user_password')
        self.client.login(username='testuser', password='user_password')
        resp = self.client.get("/api/onboarding/admin/", follow=False)
        self.assertNotEqual(resp.status_code, 200)

    def test_get(self):
        # Create an event for user b
        User = get_user_model()
        b_user = User.objects.get(username="b_user")
        mock_event = SetupEvent.objects.create(
            user=b_user, 
            step="portal.apps.onboarding.steps.test_steps.MockStep",
            state="complete"
        )

        # Unit test for get method. We are using RequestFactory.get, but
        # really just to generate a request object with an authenticated user
        request = self.factory.get("/api/onboarding/admin")
        request.user = self.admin_user

        # Get the JsonResponse from SetupAdminView.get
        response = self.view.get(request)
        result = json.loads(response.content)

        # The first result should be user with last name "b", since they have not completed setup and
        # are alphabetically first, by last name
        self.assertEqual(result[0]['lastName'], "b")

        # User b's last event should be MockStep
        self.assertEqual(
            result[0]['lastEvent']['step'],
            "portal.apps.onboarding.steps.test_steps.MockStep"
        )

        # There should be more than two users returned, total
        self.assertGreater(len(result), 2)

        # There should be two users that do not have setupComplete
        matches = [ user for user in result if user['setupComplete'] == False ]
        self.assertEqual(len(matches), 2)

        # Users with no profile should not be returned
        matches = [ user for user in result if user['lastName'] == 'no' ]
        self.assertEqual(len(matches), 0)

        # Test paginated search results
        request = self.factory.get("/api/onboarding/admin/?limit=5&page=1")
        response = self.view.get(request)
        result = json.loads(response.content)
        self.assertLessEqual(len(result), 5)

