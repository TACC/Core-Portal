from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings


class AttrDict(dict):

    def __getattr__(self, key):
        return self[key]

    def __setattr__(self, key, value):
        self[key] = value


class TestWebhooks(TestCase):
    # @classmethod
    # def setUpClass(cls):
    #     super(TestAppsApiViews, cls).setUpClass()
    #     cls.mock_agave_patcher = patch('portal.apps.auth.models.AgaveOAuthToken')
    #     cls.mock_agave = cls.mock_agave_patcher.start()
    #
    # @classmethod
    # def tearDownClass(cls):
    #     cls.mock_agave_patcher.stop()
    #     super(TestAppsApiViews, cls).tearDownClass()

    def setUp(self):
        User = get_user_model()
        user = User.objects.create_user('test', 'test@test.com', 'test')
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = user
        token.save()

    def test_webhook_job_post(self):

        with patch('portal.apps.auth.models.AgaveOAuthToken.client', new_callable=PropertyMock) as mock_client:
            self.client.login(username='test', password='test')
            apps = [
                {
                    "id": "app-one",
                    "executionSystem": "stampede2"
                },
                {
                    "id": "app-two",
                    "executionSystem": "stampede2"
                }
            ]

    def test_webhook_vnc_post(self):
        pass
