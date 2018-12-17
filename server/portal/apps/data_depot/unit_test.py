import os
from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
import json


class TestDataDepotApiViews(TestCase):

    fixtures = ['users', 'auth', 'accounts']

    @classmethod
    def setUpClass(cls):
        super(TestDataDepotApiViews, cls).setUpClass()
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()

    def setUp(self):
        self.client.force_login(get_user_model().objects.get(username="username"))
        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/agave')
        with open(
            os.path.join(
                agave_path,
                'files',
                'listing.json'
                )
        ) as _file:
            self.agave_listing = json.load(_file)
        with open(
            os.path.join(
                agave_path,
                'files',
                'data-depot-response.json'
                )
        ) as _file:
            self.EXPECTED_RESPONSE = json.load(_file)


    def test_files_listing(self):
        self.mock_client.files.list.return_value = self.agave_listing
        resp = self.client.get("/api/data-depot/files/listing/my-data/test?offset=0&limit=100")
        response_json = resp.json()
        self.assertEqual(response_json, self.EXPECTED_RESPONSE)
        self.assertEqual(self.mock_client.files.list.call_count, 1)

    def test_return_400_if_non_numerical_offset_limit(self):
        self.mock_client.files.list.return_value = self.agave_listing
        resp = self.client.get("/api/data-depot/files/listing/my-data/test?offset=str1&limit=str2")
        self.assertEqual(resp.status_code, 400)

    def test_systems_list(self):
        comm_data = settings.AGAVE_COMMUNITY_DATA_SYSTEM
        user_data = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format("username")
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
