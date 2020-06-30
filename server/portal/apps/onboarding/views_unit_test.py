from builtins import type

from django.http import HttpResponseRedirect
from portal.apps.onboarding.views import SetupStatusView
import pytest


pytestmark = pytest.mark.django_db


@pytest.fixture
def render_mock(mocker):
    yield mocker.patch('portal.apps.onboarding.views.render')


@pytest.fixture
def logout_mock(mocker):
    yield mocker.patch('portal.apps.onboarding.views.logout')


def test_get_self(rf, authenticated_user, render_mock):
    # Test when view is called with a username parameter that matches
    # the requesting user, but the requester is not a staff member
    request = rf.get("/accounts/setup")
    request.user = authenticated_user

    view = SetupStatusView()
    view.get(request, authenticated_user.username)
    render_mock.assert_called_with(
        request,
        'portal/apps/onboarding/setup.html',
        {
            "first_name": authenticated_user.first_name,
            "last_name": authenticated_user.last_name,
            "email":  authenticated_user.email,
            "username": authenticated_user.username
        }
    )


def test_get_as_staff(rf, user2, staff_user, render_mock):
    # Test when a staff member gets another user
    request = rf.get("/accounts/setup")
    request.user = staff_user
    view = SetupStatusView()
    view.get(request, user2.username)
    render_mock.assert_called_with(
        request,
        'portal/apps/onboarding/setup.html',
        {
            "first_name": user2.first_name,
            "last_name": user2.last_name,
            "email":  user2.email,
            "username": user2.username
        }
    )


def test_get_forbidden(mocker, rf, authenticated_user, user2, logout_mock):
    # Test when a non-staff user tries to get another user
    request = rf.get("/accounts/setup")
    request.user = authenticated_user
    view = SetupStatusView()
    response = view.get(request, user2.username)
    logout_mock.assert_called_with(mocker.ANY)
    assert type(response) == HttpResponseRedirect
