from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.db.models import signals
from mock import patch, ANY

from portal.apps.onboarding.models import SetupEvent
from core_apps_accounts.models import PortalProfile
from portal.apps.onboarding.middleware import SetupCompleteMiddleware
from django.http.response import HttpResponseRedirect
import pytest


pytestmark = pytest.mark.django_db


class TestSetupCompleteMiddleware(TestCase):
    def setUp(self):
        super(TestSetupCompleteMiddleware, self).setUp()
        signals.post_save.disconnect(sender=SetupEvent, dispatch_uid="setup_event")

        # Create a mock user
        User = get_user_model()
        self.user = User.objects.create_user('test', 'test@test.com', 'test')

        # Make a test HTTP request object
        self.request = RequestFactory().get('/workbench/')

        # The middleware requires a get_response function, so we will
        # create a test double that just returns the request
        self.get_response = lambda x: x

        # Make the test middleware instance
        self.middleware = SetupCompleteMiddleware(self.get_response)

    def tearDown(self):
        super(TestSetupCompleteMiddleware, self).tearDown()

    def test_non_workbench_route(self):
        request = RequestFactory().get('/about')
        response = self.middleware.__call__(request)
        self.assertEqual(response.path, '/about')

    def test_no_user(self):
        response = self.middleware.__call__(self.request)

        # Make sure we are getting redirected
        self.assertIs(type(response), HttpResponseRedirect)

    @patch('portal.apps.onboarding.middleware.logout')
    def test_no_profile(self, mock_logout):
        self.request.user = self.user
        response = self.middleware.__call__(self.request)

        # Make sure the user was redirected to the login page
        self.assertIs(type(response), HttpResponseRedirect)

        # Also make sure they were logged out
        mock_logout.assert_called_with(ANY)

    def test_setup_not_complete(self):
        # Create a portal profile for this test user, with setup_complete False
        self.user.profile = PortalProfile.objects.create(user=self.user, setup_complete=False)

        # Attach it to the test request
        self.request.user = self.user

        # Test the middleware
        response = self.middleware.__call__(self.request)

        # We should get a redirect
        self.assertIs(type(response), HttpResponseRedirect)

    def test_setup_complete(self):
        self.user.profile = PortalProfile.objects.create(user=self.user, setup_complete=True)
        self.request.user = self.user
        response = self.middleware.__call__(self.request)

        # If we reached the end of the middleware successfully,
        # the input request should have been returned
        self.assertEqual(response, self.request)
