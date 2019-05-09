import os
import json
import datetime
from mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from portal.apps.data_depot.models import PublicUrl


class TestDataDepotApiViews(TestCase):
    fixtures = ['users', 'auth']

    @classmethod
    def setUpClass(cls):
        super(TestDataDepotApiViews, cls).setUpClass()
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()
        super(TestDataDepotApiViews, cls).tearDownClass()

    def setUp(self):
        self.mock_client.reset_mock()

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

        with open(
            os.path.join(
                agave_path,
                'files',
                'file-listing.json'
            )
        ) as _file:
            self.agave_file_listing = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'data-depot-file-response.json'
            )
        ) as _file:
            self.EXPECTED_FILE_RESPONSE = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'pems.json'
            )
        ) as _file:
            self.agave_pems_listing = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'data-depot-file-pems-response.json'
            )
        ) as _file:
            self.EXPECTED_PEMS_RESPONSE = json.load(_file)

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

    def test_single_file_listing(self):
        self.mock_client.files.list.return_value = self.agave_file_listing
        resp = self.client.get("/api/data-depot/files/listing/my-data/parent_folder/sub_folder/file.txt")
        self.assertEqual(resp.json(), self.EXPECTED_FILE_RESPONSE)

    @patch('portal.apps.data_depot.managers.base.service_account')
    def test_pems_listing(self, mocked_service_account):
        self.mock_client.files.listPermissions.return_value = self.agave_pems_listing

        mocked_service_account.return_value = self.mock_client

        resp = self.client.get("/api/data-depot/files/pems/my-data/test")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), self.EXPECTED_PEMS_RESPONSE)


class TestPublicUrlModel(TestCase):

    def test_dict_method(self):

        testUrl = PublicUrl(
            file_id='file01',
            postit_url='http://postit_url',
            updated=datetime.datetime(2019, 5, 1, 14, 51, 5, 930428),
            expires=datetime.datetime(2020, 5, 1, 14, 51, 5, 930428)
        )
        testUrl.save()
        urldict = PublicUrl.objects.get(pk='file01').to_dict()
        self.assertEqual(urldict, {
            'file_id': 'file01',
            'postit_url': 'http://postit_url',
            'updated': '2019-05-01 14:51:05.930428+00:00',
            'expires': '2020-05-01 14:51:05.930428+00:00'
        })
