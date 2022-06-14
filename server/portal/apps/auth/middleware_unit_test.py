from django.test import (
    TransactionTestCase,
    RequestFactory
)
from mock import patch, MagicMock
from portal.apps.auth.middleware import TapisTokenRefreshMiddleware
from requests.exceptions import RequestException, HTTPError
from django.core.exceptions import ObjectDoesNotExist


class TestTapisOAuthMiddleware(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super(TestTapisOAuthMiddleware, cls).setUpClass()
        cls.request = RequestFactory().get("/api/data-depot")
        cls.mock_logout_patcher = patch('portal.apps.auth.middleware.logout')
        cls.mock_logout = cls.mock_logout_patcher.start()

    @classmethod
    def tearDownClass(cls):
        super(TestTapisOAuthMiddleware, cls).tearDownClass()
        cls.mock_logout_patcher.stop()

    def setUp(self):
        super(TestTapisOAuthMiddleware, self).setUp()
        self.get_user_patcher = patch('portal.apps.auth.middleware.get_user')
        self.mock_get_user = self.get_user_patcher.start()
        self.mock_get_user.return_value = MagicMock(
            is_authenticated=lambda: True,
            username="MOCK_USER"
        )

        # Mock the atomically retrieved TapisOAuthToken object
        self.mock_tapis_oauth = MagicMock()
        self.TapisOAuthToken_patcher = patch('portal.apps.auth.middleware.TapisOAuthToken.objects')
        self.mock_TapisOAuthToken = self.TapisOAuthToken_patcher.start()
        self.mock_TapisOAuthToken.filter.return_value.select_for_update.return_value.get.return_value = \
            self.mock_tapis_oauth

        self.mock_get_response = MagicMock(return_value="MOCK_RESPONSE")
        self.middleware = TapisTokenRefreshMiddleware(self.mock_get_response)

    def tearDown(self):
        super(TestTapisOAuthMiddleware, self).tearDown()
        self.get_user_patcher.stop()
        self.TapisOAuthToken_patcher.stop()

    def test_valid_user(self):
        # Test middleware for user that is fully authenticated
        self.mock_tapis_oauth.expired = False
        response = self.middleware.__call__(self.request)
        self.assertEqual(response, "MOCK_RESPONSE")

    def test_expired_user(self):
        self.mock_tapis_oauth.expired = True
        response = self.middleware.__call__(self.request)
        self.assertEqual(response, "MOCK_RESPONSE")
        self.mock_tapis_oauth.client.token.refresh.assert_called_with()

    def test_refresh_error(self):
        self.mock_tapis_oauth.expired = True
        self.mock_tapis_oauth.client.token.refresh.side_effect = HTTPError
        response = self.middleware.__call__(self.request)
        self.assertEqual(response.status_code, 401)
        self.mock_logout.assert_called_with(self.request)

    @patch('portal.apps.auth.middleware.transaction')
    def test_logouts(self, mock_transaction):
        mock_transaction.atomic.side_effect = RequestException
        response = self.middleware.__call__(self.request)
        self.assertEqual(response.status_code, 401)
        self.mock_logout.assert_called_with(self.request)

        mock_transaction.atomic.side_effect = ObjectDoesNotExist
        response = self.middleware.__call__(self.request)
        self.assertEqual(response.status_code, 401)
        self.mock_logout.assert_called_with(self.request)
