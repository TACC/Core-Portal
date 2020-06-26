from mock import MagicMock
from django.core.exceptions import PermissionDenied
from django.http import (
    Http404,
    JsonResponse,
    HttpResponseBadRequest
)
import json
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.api.views import (
    SetupStepView,
    SetupAdminView
)
import pytest
import logging

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


"""
SetupStepView tests
"""


def test_get_user_parameter(rf, authenticated_user):
    request = rf.get("/api/onboarding/user/username")
    request.user = authenticated_user
    view = SetupStepView()
    # A user should be able to retrieve themselves
    assert view.get_user_parameter(request, "username") == authenticated_user

    # A user should not be able to retrieve someone else's setup events
    with pytest.raises(PermissionDenied):
        view.get_user_parameter(request, "other")


def test_get_user_parameter_as_staff(rf, authenticated_user, staff_user):
    request = rf.get("/api/onboarding/user/username")
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


"""
SetupAdminView tests
"""


def test_admin_route(rf, staff_user):
    view = SetupAdminView()

    # If the user is authenticated and is_staff, then the route should
    # return a JsonResponse
    request = rf.get("/api/onboarding/admin")
    request.user = staff_user

    # Get the JsonResponse from SetupAdminView.get
    response = view.get(request)
    assert type(response) == JsonResponse


def test_admin_route_is_protected(authenticated_user, client):
    # Test to make sure route is protected
    # If the user is not staff, then the route should return a redirect
    response = client.get("/api/onboarding/admin/", follow=False)
    assert response.status_code == 302


def test_create_user_result(mock_steps, authenticated_user):
    view = SetupAdminView()

    # Test retrieving a user's events
    result = view.create_user_result(authenticated_user)
    assert result["lastEvent"].step == "portal.apps.onboarding.steps.test_steps.MockStep"

    # Test retrieving a user with no events
    SetupEvent.objects.all().delete()
    result = view.create_user_result(authenticated_user)
    assert "lastEvent" not in result


def test_get_no_profile(rf, staff_user, authenticated_user):
    view = SetupAdminView()

    # Test that no object is returned for a user with no profile
    authenticated_user.profile.delete()
    request = rf.get("/api/onboarding/admin/")
    request.user = staff_user
    response = view.get(request)
    response_data = json.loads(response.content)

    # authenticated_user should not appear in results
    assert not any(
        [True for user in response_data['users'] if user['username'] == authenticated_user.username]
    )


def test_get(rf, staff_user, authenticated_user, mock_steps):
    authenticated_user.profile.setup_complete = False
    authenticated_user.profile.save()

    staff_user.profile.setup_complete = True
    staff_user.profile.save()

    view = SetupAdminView()

    # Unit test for get method. We are using RequestFactory.get, but
    # really just to generate a request object with an authenticated user
    request = rf.get("/api/onboarding/admin/")
    request.user = staff_user

    # Get the JsonResponse from SetupAdminView.get
    response = view.get(request)
    result = json.loads(response.content)

    users = result["users"]

    # The first result should be the authenticated_user, since they have not completed setup
    assert users[0]["username"] == authenticated_user.username

    # User authenticated_user's last event should be MockStep
    assert users[0]['lastEvent']['step'] == "portal.apps.onboarding.steps.test_steps.MockStep"

    # There should be two users returned
    assert len(users) == 2
