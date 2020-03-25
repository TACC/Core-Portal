from mock import patch, ANY
from django.contrib.auth import get_user_model
from django.http import HttpResponseRedirect
from django.test import TestCase, RequestFactory
from portal.apps.auth.models import AgaveOAuthToken
from portal.apps.onboarding.views import SetupStatusView
import pytest


pytestmark = pytest.mark.django_db


class TestSetupStatusView(TestCase):
    def setUp(self):
        super(TestSetupStatusView, self).setUp()
        User = get_user_model()
        self.user = User.objects.create_user("mockuser", "mock@user.com", "password")
        self.user.first_name = "mock"
        self.user.last_name = "user"
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = self.user
        token.save()
        self.user.save()

        self.rf = RequestFactory()

        self.render_patcher = patch('portal.apps.onboarding.views.render')
        self.mock_render = self.render_patcher.start()

        self.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        self.mock_client = self.mock_client_patcher.start()

        self.mock_logout_patcher = patch('portal.apps.onboarding.views.logout')
        self.mock_logout = self.mock_logout_patcher.start()

        self.view = SetupStatusView()

    def tearDown(self):
        super(TestSetupStatusView, self).tearDown()
        self.render_patcher.stop()
        self.mock_client_patcher.stop()
        self.mock_logout_patcher.stop()

    def test_get_self(self):
        # Test when view is called with a username parameter that matches
        # the requesting user, but the requester is not a staff member
        request = self.rf.get("/accounts/setup")
        request.user = self.user
        self.view.get(request, "mockuser")
        self.mock_render.assert_called_with(
            request,
            'portal/apps/onboarding/setup.html',
            {
                "first_name": "mock",
                "last_name": "user",
                "email": "mock@user.com",
                "username": "mockuser"
            }
        )

    def test_get_as_staff(self):
        # Test when a staff member gets another user
        request = self.rf.get("/accounts/setup")
        self.user.username = "staff"
        self.user.is_staff = True
        request.user = self.user
        self.view.get(request, "mockuser")
        self.mock_render.assert_called_with(
            request,
            'portal/apps/onboarding/setup.html',
            {
                "first_name": "mock",
                "last_name": "user",
                "email": "mock@user.com",
                "username": "mockuser"
            }
        )

    def test_get_forbidden(self):
        # Test when a non-staff user tries to get another user
        request = self.rf.get("/accounts/setup")
        request.user = self.user
        response = self.view.get(request, "otheruser")
        self.mock_logout.assert_called_with(ANY)
        self.assertEqual(type(response), HttpResponseRedirect)
