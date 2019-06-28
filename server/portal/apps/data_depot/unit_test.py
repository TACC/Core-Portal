import os
import json
import datetime
from mock import patch
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.conf import settings
from portal.apps.data_depot.models import PublicUrl
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from google.oauth2.credentials import Credentials


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
        self.assertTrue(len(data["response"]) == 3)

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


class TestGoogleDriveApiViews(TestCase):
    fixtures = ['users', 'auth']

    @classmethod
    def setUpClass(cls):
        super(TestGoogleDriveApiViews, cls).setUpClass()
        cls.mock_client_patcher = patch(
            'portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        cls.mock_client = cls.mock_client_patcher.start()

        cls.mock_gdrive_client_patcher = patch(
            'portal.apps.googledrive_integration.models.GoogleDriveUserToken.client', autospec=True)
        cls.mock_gdrive_client = cls.mock_gdrive_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()
        cls.mock_gdrive_client_patcher.stop()
        super(TestGoogleDriveApiViews, cls).tearDownClass()

    def setUp(self):
        self.mock_client.reset_mock()
        self.client.force_login(get_user_model().objects.get(username="username"))
        self.mock_client.user = get_user_model().objects.get(username="username")

        token = GoogleDriveUserToken(
            user=get_user_model().objects.get(username="username"),
            credentials=Credentials(token='asdf', refresh_token='1234')
        )
        token.save()

    def test_pems_listing(self):
        pems = [{
            'username': self.mock_client.user.username,
            'permission': {
                'read': True,
                'write': False,
                'execute': False
            }
        }]

        resp = self.client.get("/api/data-depot/files/pems/google-drive/012345")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), {'response': pems})

    def test_files_listing(self):
        root_get = {'id': 'someRootId',
                    'mimeType': 'application/vnd.google-apps.folder',
                    'modifiedTime': '2017-08-28T21:37:37.081Z',
                    'name': 'My Drive'}

        root_listing = {
            "files": [
                {
                    "id": "12345ABCD",
                    "mimeType": "application/vnd.google-apps.drawing",
                    "modifiedTime": "2019-04-24T21:19:20.291Z",
                    "name": "A Test Drawing",
                    "parents": [
                        "someRootId"
                    ]
                },
                {
                    "id": "45678EFGH",
                    "mimeType": "application/vnd.google-apps.document",
                    "modifiedTime": "2019-04-19T19:38:14.888Z",
                    "name": "A Test Document",
                    "parents": [
                        "someRootId"
                    ]
                }
            ]
        }

        fmgr_listing = {
            '_actions': [],
            'children': [
                {
                    '_actions': [],
                    'ext': None,
                    'id': 'file/45678EFGH',
                    'lastModified': '2019-04-19T19:38:14.888Z',
                    'length': None,
                    'name': 'A Test Document',
                    'path': '/A Test Document',
                    'permissions': 'ALL',
                    'resource': 'googledrive',
                    'system': None,
                    'trail': [],
                    'type': 'file'
                },
                {
                    '_actions': [],
                    'ext': None,
                    'id': 'file/12345ABCD',
                    'lastModified': '2019-04-24T21:19:20.291Z',
                    'length': None,
                    'name': 'A Test Drawing',
                    'path': '/A Test Drawing',
                    'permissions': 'ALL',
                    'resource': 'googledrive',
                    'system': None,
                    'trail': [],
                    'type': 'file'
                }
            ],
            'ext': None,
            'id': 'dir/someRootId',
            'lastModified': '2017-08-28T21:37:37.081Z',
            'length': None,
            'name': 'My Drive',
            'path': '',
            'permissions': 'ALL',
            'resource': 'googledrive',
            'system': None,
            'trail': [],
            'type': 'dir'
        }

        self.mock_gdrive_client.files.return_value.get.return_value.execute.return_value = root_get
        self.mock_gdrive_client.files.return_value.list.return_value.execute.return_value = root_listing

        resp = self.client.get("/api/data-depot/files/listing/google-drive/root")
        response_json = resp.json()

        self.assertEqual(response_json, {'response': fmgr_listing})
        self.assertEqual(self.mock_gdrive_client.files.return_value.list.return_value.execute.call_count, 1)
