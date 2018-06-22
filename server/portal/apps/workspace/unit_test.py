from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken

class TestAppsApiViews(TestCase):
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

    def test_apps_list(self):

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

            #need to do a return_value on the mock_client because
            #the calling signature is something like client = Agave(**kwargs).apps.list()
            mock_client.return_value.apps.list.return_value = apps
            response = self.client.get('/api/workspace/apps/', follow=True)
            data = response.json()
            # If the request is sent successfully, then I expect a response to be returned.
            self.assertEqual(response.status_code, 200)
            self.assertTrue("response" in data)
            self.assertEqual(len(data["response"]), 2)
