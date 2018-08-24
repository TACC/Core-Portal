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
        comm_data = settings.AGAVE_COMMUNITY_DATA_SYSTEM
        user_data = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX
        self.client.login(username='test', password='test')
        resp = self.client.get("/api/data-depot/systems/list/", follow=True)
        data = resp.json()
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(comm_data in resp.content)
        self.assertTrue(user_data in resp.content)
        # should only return user data system and community
        self.assertTrue("response" in data)
        self.assertTrue(len(data["response"]) == 2)

    def test_projects_list(self):
        """https://agavepy.readthedocs.io/en/latest/agavepy.systems.html"""
        pass
