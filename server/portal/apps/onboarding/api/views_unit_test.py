from django.test import TestCase, RequestFactory
from mock import MagicMock
from django.core.exceptions import PermissionDenied
from django.http import (
    Http404,
    JsonResponse,
    HttpResponseBadRequest
)
from django.contrib.auth import get_user_model

import json
from portal.apps.accounts.models import PortalProfile
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.api.views import (
    SetupStepView,
    SetupAdminView
)
import pytest
import logging
from unittest import skip

logger = logging.getLogger(__name__)

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def mocked_executor(mocker):
    yield mocker.patch('portal.apps.onboarding.api.views.execute_setup_steps')


@pytest.fixture(autouse=True)
def mocked_log_setup_state(mocker):
    yield mocker.patch('portal.apps.onboarding.api.views.log_setup_state')


@pytest.fixture
def mock_steps(authenticated_user, settings):
    settings.PORTAL_USER_ACCOUNT_SETUP_STEPS = ['portal.apps.onboarding.steps.test_steps.MockStep']
    pending_step = SetupEvent.objects.create(
        user=authenticated_user,
        step="portal.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.PENDING,
        message="message"
    ).save()

    completed_step = SetupEvent.objects.create(
        user=authenticated_user,
        step="portal.apps.onboarding.steps.test_steps.MockStep",
        state=SetupState.COMPLETED,
        message="message",
    ).save()
    yield (pending_step, completed_step,)


def test_get_user_parameter(rf, authenticated_user):
    request = RequestFactory().get("/api/onboarding/user/username")
    request.user = authenticated_user
    view = SetupStepView()
    # A user should be able to retrieve themselves
    assert view.get_user_parameter(request, "username") == authenticated_user

    # A user should not be able to retrieve someone else's setup events
    with pytest.raises(PermissionDenied):
        view.get_user_parameter(request, "other")


def test_get_user_parameter_as_staff(rf, authenticated_user, staff_user):
    request = RequestFactory().get("/api/onboarding/user/username")
    request.user = staff_user
    view = SetupStepView()

    # A staff user should be able to retrieve another user's setup events
    assert view.get_user_parameter(request, "username") == authenticated_user

    # An 404 should be raised when trying to retrieve a non-existent user
    with pytest.raises(Http404):
        view.get_user_parameter(request, "other")


def test_get_user_as_user(settings, authenticated_user, client, mock_steps):
    # A user should be able to retrieve their own setup event info
    client.force_login(authenticated_user)
    response = client.get("/api/onboarding/user/username", follow=True)
    result = response.json()

    # Make sure we got a valid response
    assert result["username"] == "username"
    assert "steps" in result
    assert result["steps"][0]["step"] == 'portal.apps.onboarding.steps.test_steps.MockStep'
    assert result["steps"][0]["displayName"] == 'Mock Step'
    assert result["steps"][0]["state"] == SetupState.COMPLETED
    assert len(result["steps"][0]["events"]) == 2


def test_get_user_as_staff(settings, staff_user, client, mock_steps):
    client.force_login(staff_user)
    response = client.get("/api/onboarding/user/username", follow=True)
    result = response.json()

    # Make sure result json is correct.
    assert result["username"] == "username"
    assert len(result["steps"][0]["events"]) == 2


def test_forbidden(client, authenticated_user):
    client.force_login(authenticated_user)
    response = client.get("/api/onboarding/user/invalid/", follow=True)
    # This raises an error, which is caught and converted
    # into a 500 by portal.views.base
    assert response.status_code != 200


def test_not_found(client, staff_user):
    client.force_login(staff_user)
    response = client.get("/api/onboarding/user/invalid/", follow=True)
    assert response.status_code != 200


def test_incomplete_post(rf, authenticated_user):
    view = SetupStepView()

    # post should return HttpResponseBadRequest if fields are missing
    request = rf.post(
        "/api/onboarding/user/username",
        content_type="application/json",
        data=json.dumps({"action": "user_confirm"})
    )
    request.user = authenticated_user
    response = view.post(request, "username")
    assert type(response) == HttpResponseBadRequest

    request = rf.post(
        "/api/onboarding/user/username",
        content_type="application/json",
        data=json.dumps({"step": "setupstep"})
    )
    request.user = authenticated_user
    response = view.post(request, "username")
    assert type(response) == HttpResponseBadRequest


def test_client_action(authenticated_user, rf):
    view = SetupStepView()
    mock_step = MagicMock()
    mock_step.step_name.return_value = "Mock Step"
    request = rf.post("/api/onboarding/user/username")
    request.user = authenticated_user
    view.client_action(
        request,
        mock_step,
        "user_confirm",
        None
    )
    mock_step.log.assert_called()
    mock_step.client_action.assert_called_with(
        "user_confirm",
        None,
        request
    )


def test_reset_not_staff(authenticated_user, rf):
    view = SetupStepView()
    mock_step = MagicMock()
    # A user should not be able to perform the reset action
    with pytest.raises(PermissionDenied):
        request = rf.post("/api/onboarding/user/username")
        request.user = authenticated_user
        view.reset(request, mock_step)


def test_reset(rf, staff_user, authenticated_user, mocked_log_setup_state):
    # The reset function should call prepare on a step
    # and flag the user's setup_complete as False
    view = SetupStepView()
    request = rf.post("/api/onboarding/user/username")
    request.user = staff_user
    mock_step = MagicMock()
    mock_step.user = authenticated_user

    # Call reset function
    view.reset(request, mock_step)

    mock_step.prepare.assert_called()
    mock_step.log.assert_called()
    mocked_log_setup_state.assert_called()
    assert not mock_step.user.profile.setup_complete


def test_complete_not_staff(rf, authenticated_user):
    view = SetupStepView()
    mock_step = MagicMock()
    request = rf.post("/api/onboarding/user/username")
    request.user = authenticated_user
    with pytest.raises(PermissionDenied):
        view.complete(request, mock_step)


def test_complete(rf, staff_user, authenticated_user, mock_steps, mocked_executor):
    view = SetupStepView()

    request = rf.post(
        "/api/onboarding/user/username",
        content_type='application/json',
        data=json.dumps({
            "action": "complete",
            "step": "portal.apps.onboarding.steps.test_steps.MockStep"
        })
    )
    request.user = staff_user
    response = view.post(request, "username")

    # set_state should have put MockStep in COMPLETED, as per request
    events = [event for event in SetupEvent.objects.all()]
    assert events[-1].step == "portal.apps.onboarding.steps.test_steps.MockStep"
    assert events[-1].state == SetupState.COMPLETED

    # execute_setup_steps should have been run
    mocked_executor.apply_async.assert_called_with(args=[authenticated_user.username])
    last_event = json.loads(response.content)
    assert last_event["state"] == SetupState.COMPLETED


@skip("Need to rewrite onboarding unit tests with fixtures")
class TestSetupAdminViews(TestCase):
    @classmethod
    def setUpClass(cls):
        super(TestSetupAdminViews, cls).setUpClass()

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
        PortalProfile(user=c_user)
        c_user.profile.save()
        c_user.save()

        b_user = cls.User.objects.create_user("b_user", "b@user.com", "bpassword")
        b_user.last_name = "b"
        b_user.first_name = "user"
        PortalProfile(user=b_user)
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
        request = self.factory.get("/api/onboarding/admin")
        request.user = self.admin_user

        # Get the JsonResponse from SetupAdminView.get
        resp = self.view.get(request)
        logger.debug(resp)
        self.assertEqual(type(resp), JsonResponse)

    def test_admin_route_is_protected(self):
        # Integration test to make sure route is protected
        # If the user is not staff, then the route should return a redirect
        self.non_admin = self.User.objects.create_user('testuser', 'test@user.com', 'user_password')
        self.client.login(username='testuser', password='user_password')
        resp = self.client.get("/api/onboarding/admin/", follow=False)
        self.assertNotEqual(resp.status_code, 200)

    def test_create_user_result(self):
        # Test a user with no events
        User = get_user_model()
        b_user = User.objects.get(username="b_user")
        user_result = self.view.create_user_result(b_user)
        self.assertEqual(user_result['username'], "b_user")
        self.assertEqual(user_result['lastName'], "b")
        self.assertEqual(user_result['email'], "b@user.com")

        # Test with an event
        SetupEvent.objects.create(
            user=b_user,
            step="portal.apps.onboarding.steps.test_steps.MockStep",
            state="complete"
        )
        user_result = self.view.create_user_result(b_user)
        self.assertEqual(
            user_result['lastEvent'].step,
            "portal.apps.onboarding.steps.test_steps.MockStep"
        )

    def test_get_no_profile(self):
        # Test that no object is returned for a user with no profile
        d_user = get_user_model().objects.create_user("d_user", "d@user.com", "dpassword")
        d_user.last_name = "d"
        d_user.first_name = "user"
        d_user.save()
        request = self.factory.get("/api/onboarding/admin")
        response = self.view.get(request)
        response_data = json.loads(response.content)

        # d_user should not be in the list of users returned
        d_user_result = [user for user in response_data['users'] if user['username'] == 'd_user']
        self.assertEqual(len(d_user_result), 0)

    def test_get(self):
        # Create an event for user b
        User = get_user_model()
        b_user = User.objects.get(username="b_user")
        SetupEvent.objects.create(
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

        users = result["users"]

        # The first result should be user with last name "b", since they have not completed setup and
        # are alphabetically first, by last name
        self.assertEqual(users[0]['lastName'], "b")

        # User b's last event should be MockStep
        self.assertEqual(
            users[0]['lastEvent']['step'],
            "portal.apps.onboarding.steps.test_steps.MockStep"
        )

        # There should be more than two users returned, total
        self.assertGreater(len(users), 2)

        # There should be two users that do not have setupComplete
        matches = [user for user in users if user['setupComplete'] is False]
        self.assertEqual(len(matches), 2)

        # Users with no profile should not be returned
        matches = [user for user in users if user['lastName'] == 'no']
        self.assertEqual(len(matches), 0)
