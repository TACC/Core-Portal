from mock import Mock, patch, MagicMock, ANY
from django.test import TestCase, RequestFactory
from portal.apps.auth.views import agave_oauth_callback

class TestAgaveOAuthCallback(TestCase):
    def setUp(self):
        super(TestAgaveOAuthCallback, self).setUp()
        self.rf = RequestFactory()
        self.render_patcher = patch('portal.apps.auth.views.render')
        self.mock_render = self.render_patcher.start()

    def tearDown(self):
        super(TestAgaveOAuthCallback, self).tearDown()
        self.render_patcher.stop()

    @patch('portal.apps.auth.views.requests')
    def test_oauth_failure(self, mock_requests):
        # Mock an error response from the agave tenant's /token endpoint
        mock_requests.post.return_value = MagicMock(status_code=500)

        # Generate an Agave OAuth callback request
        callback_request = self.rf.get('/auth/agave/callback?state=1234&code=1234')

        # Mock a session with an auth_state value for the request
        setattr(callback_request, 'session', { 'auth_state': '1234' })

        # Run the callback view
        result = agave_oauth_callback(callback_request)

        # Assert that an error message was rendered
        self.mock_render.assert_called_with(
            callback_request, 
            'portal/apps/auth/autherror.html',
            { "state": "1234" }
        )