from mock import Mock, patch, MagicMock, PropertyMock, ANY
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.http.response import HttpResponseRedirect
from portal.decorators.api_authentication import api_login_required, staff_login_required

class TestDecorators(TestCase):

    @classmethod
    def setUpClass(cls):
        # A mock method to be wrapped in a decorator
        cls.mock_view = Mock()
        # Decorated methods require a __name__ field (can be anything)
        cls.mock_view.__name__ = "mock_view"

        # Create a real user for tests
        User = get_user_model()
        cls.test_user = User.objects.create_user(username='test_user', email='test@email.com', password='password')

        # Create a mocked noauth user, whose is_authenticated() method always returns False
        cls.mock_noauth_user = MagicMock(spec=User)
        cls.mock_noauth_user.is_authenticated = MagicMock(return_value=False)

    @classmethod
    def tearDownClass(cls):
        # setUpClass requires a tearDownClass definition, even if it does nothing
        pass

    def setUp(self):
        # Request factory for generating valid request objects
        self.factory = RequestFactory()

    def test_api_login_required(self):
        # Create a request object with a user attached to it
        request = self.factory.get('/')
        request.user = self.test_user

        # Use the decorator as a wrapper for the mock function
        decorated_mock_view = api_login_required(self.mock_view)

        # Call the wrapped function with the function's expected parameters
        response = decorated_mock_view(request)

        # api_login_required should call through the wrapped function if the user is authenticated
        self.mock_view.assert_called_with(ANY)

    def test_api_login_required_fail(self):
        # Create a request with the mocked noauth user
        request = self.factory.get('/')
        request.user = self.mock_noauth_user

        # Wrap and call
        decorated_mock_view = api_login_required(self.mock_view)
        response = decorated_mock_view(request)

        # api_login_required's return object should have a status_code of 401 for noauth users
        self.assertEqual(response.status_code, 401)

    def test_staff_login_required(self):
        request = self.factory.get('/')
        # Set the test user's is_staff flag to True
        self.test_user.is_staff = True
        request.user = self.test_user
        decorated_mock_view = staff_login_required(self.mock_view)
        response = decorated_mock_view(request)
        self.mock_view.assert_called_with(ANY)

    def test_staff_login_required_failed(self):
        # Test a user that is authenticated but is not staff
        request = self.factory.get('/')
        self.test_user.is_staff = False
        request.user = self.test_user
        decorated_mock_view = staff_login_required(self.mock_view)
        response = decorated_mock_view(request) 
        self.assertEqual(response.status_code, 401)
        
        # Test a user that is not authenticated
        request = self.factory.get('/')
        request.user = self.mock_noauth_user
        decorated_mock_view = staff_login_required(self.mock_view)
        response = decorated_mock_view(request)
        self.assertEqual(response.status_code, 401)
        