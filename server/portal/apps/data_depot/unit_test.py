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


class TestDataDepotApiViews(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()

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

    def test_systems_list(self):
        self.client.login(username='test', password='test')
        self.assertTrue(True)

    def test_projects_list(self):
        """https://agavepy.readthedocs.io/en/latest/agavepy.systems.html"""
        
        self.client.login(username='test', password='test')
        systems = [
            AttrDict({
                "id": "123",
                "name": "data-portal-community"
            }),
            AttrDict({
                "id": "456",
                "name": "data-tacc-work-test"
            })
        ]

        #need to do a return_value on the mock_client because
        #the calling signature is something like client = Agave(**kwargs).apps.list()
        self.mock_client.systems.list.return_value = systems
        response = self.client.get('/api/data-depot/projects/', follow=True)
        data = response.json()
        #make sure that the listing was actually called
        self.assertTrue(self.mock_client.systems.list.called)
        # If the request is sent successfully, then I expect a response to be returned.
        self.assertEqual(response.status_code, 200)
        # The format of the JSON responses from the data depot are something like
        # {"response": PAYLOAD}
        self.assertTrue("response" in data)

        returned_systems = data["response"]

        self.assertEqual(len(data["response"]), 0)

    def test_projects_list_real(self):
        """https://agavepy.readthedocs.io/en/latest/agavepy.systems.html"""

        self.client.login(username='test', password='test')
        systems = [
            AttrDict({
                "id": "data-projects-test",
                "name": "test project 1"
            }),
            AttrDict({
                "id": "data-work-test",
                "name": "test project 2"
            })
        ]

        #need to do a return_value on the mock_client because
        #the calling signature is something like client = Agave(**kwargs).apps.list()
        self.mock_client.systems.list.return_value = systems
        response = self.client.get('/api/data-depot/projects/', follow=True)
        data = response.json()
        #make sure that the listing was actually called
        self.assertTrue(self.mock_client.systems.list.called)
        # If the request is sent successfully, then I expect a response to be returned.
        self.assertEqual(response.status_code, 200)
        # The format of the JSON responses from the data depot are something like
        # {"response": PAYLOAD}
        self.assertTrue("response" in data)

        returned_systems = data["response"]

        self.assertEqual(len(data["response"]), 1)
