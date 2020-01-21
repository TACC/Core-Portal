import os
import json
import datetime
from mock import patch, MagicMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from portal.apps.data_depot.managers.base import AgaveFileManager
from portal.apps.data_depot.managers.public import FileManager as PublicFileManager
from portal.libs.agave.serializers import BaseAgaveFileSerializer
from portal.apps.data_depot.models import PublicUrl
from portal.apps.data_depot.managers.google_drive import FileManager as GoogleDriveFileManager
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from datetime import timedelta
from dateutil.tz import tzutc
from django.core.exceptions import PermissionDenied
from google.oauth2.credentials import Credentials
from portal.exceptions.api import ApiException

from portal.apps.data_depot.managers.neurodata import FileManager as NeurodataFileManager

class TestAgaveFileManager(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        cls.mock_client = cls.mock_client_patcher.start()

        testUrl = PublicUrl(
            file_id='cep.test//file01',
            postit_url='http://postit_url',
            updated=datetime.datetime(2019, 5, 1, 14, 51, 5, 930428, tzinfo=tzutc()),
            expires=datetime.datetime(2020, 5, 1, 14, 51, 5, 930428, tzinfo=tzutc())
        )
        testUrl.save()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()

    def test_public_url_no_refresh(self):

        fmgr = AgaveFileManager(self.mock_client)
        testUrl = fmgr.public_url('cep.test//file01', refresh=False)

        self.assertEqual(testUrl, {
            'file_id': 'cep.test//file01',
            'postit_url': 'http://postit_url',
            'updated': '2019-05-01 14:51:05.930428+00:00',
            'expires': '2020-05-01 14:51:05.930428+00:00'
        })

    @patch('portal.apps.data_depot.managers.base.timezone')
    @patch('portal.apps.data_depot.managers.base.AgaveFileManager.get_file')
    def test_public_url_with_refresh(self, mock_get, mock_tz):

        fmgr = AgaveFileManager(self.mock_client)
        mock_tz.now.return_value = datetime.datetime(2019, 5, 1, 14, 51, 5, 930428, tzinfo=tzutc()) 
        new_time = datetime.datetime(2019, 5, 1, 14, 51, 5, 930428, tzinfo=tzutc()) + timedelta(seconds=int(3.154e7))

        mock_get.return_value.postit.return_value = 'http://postit_url2'

        testUrl = fmgr.public_url('cep.test//file01', refresh=True)
        self.assertEqual(testUrl, {
            'file_id': 'cep.test//file01',
            'postit_url': 'http://postit_url2',
            'updated': '2019-05-01 14:51:05.930428+00:00',
            'expires': '2020-04-30 15:57:45.930428+00:00'
        })

    @patch('portal.apps.data_depot.managers.base.AgaveFileManager.get_file')
    def test_public_url_throws_on_folder(self, mock_get):
        mock_get.return_value.type = 'dir'
        fmgr = AgaveFileManager(self.mock_client)

        with self.assertRaises(ValueError):
            testUrl = fmgr.public_url('cep.test//file01', refresh=False)

class TestPublicFileManager(TestCase):

    @patch('portal.apps.data_depot.managers.public.service_account')
    def test_public_file_mgr_init(self, mock_service_account):
        mock_ac = MagicMock()
        mock_request = MagicMock()
        mock_service_account.return_value = mock_ac
        mock_request.session.session_key = 'abcdefg'

        public_fm = PublicFileManager(mock_request)

        self.assertEqual(public_fm.serializer_cls, BaseAgaveFileSerializer)
        self.assertFalse(public_fm.requires_auth)

    @patch('portal.apps.data_depot.managers.public.service_account')
    def test_public_file_mgr_unsafe_actions_not_implemented(self, mock_service_account):
        mock_ac = MagicMock()
        mock_request = MagicMock()
        mock_service_account.return_value = mock_ac
        mock_request.session.session_key = 'abcdefg'

        public_fm = PublicFileManager(mock_request)

        self.assertEqual(public_fm.delete('file01'), NotImplemented)
        self.assertEqual(public_fm.mkdir('file01'), NotImplemented)
        self.assertEqual(public_fm.mkdir('file01'), NotImplemented)
        self.assertEqual(public_fm.trash('file01'), NotImplemented)
        self.assertEqual(public_fm.upload('dest', ['file01']), NotImplemented)
        self.assertEqual(public_fm.update_pems('file01', {}), NotImplemented)
        self.assertEqual(public_fm.rename('file01', 'newname'), NotImplemented)

    @patch('portal.apps.data_depot.managers.public.service_account')
    def test_public_file_mgr_copy_checks_auth_fail(self, mock_service_account):
        mock_ac = MagicMock()
        mock_request = MagicMock()
        mock_service_account.return_value = mock_ac
        mock_request.session.session_key = 'abcdefg'
        mock_request.user.is_authenticated = False
        public_fm = PublicFileManager(mock_request)

        with self.assertRaises(PermissionDenied):
            public_fm.copy('scr', 'dest')

    @patch('portal.apps.data_depot.managers.public.service_account')
    @patch('portal.apps.data_depot.managers.base.AgaveFileManager.copy')
    def test_public_file_mgr_copy_checks_auth_pass(self, mock_copy, mock_service_account):
        mock_copy.return_value = "placeholder"
        mock_ac = MagicMock()
        mock_request = MagicMock()
        mock_service_account.return_value = mock_ac
        mock_request.session.session_key = 'abcdefg'
        mock_request.user.is_authenticated = True
        public_fm = PublicFileManager(mock_request)

        result = public_fm.copy('source', 'dest')
        mock_copy.assert_called_with('source', 'dest')
        self.assertEquals(result, mock_copy.return_value)

class TestGoogleDriveFileManager(TestCase):
    fixtures = ['users', 'auth']

    @classmethod
    def setUpClass(cls):
        super(TestGoogleDriveFileManager, cls).setUpClass()
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
        super(TestGoogleDriveFileManager, cls).tearDownClass()

    def setUp(self):
        self.mock_client.reset_mock()
        self.mock_client.user = get_user_model().objects.get(username="username")

    def test_no_googldrive_client(self):
        with self.assertRaises(ApiException):
            GoogleDriveFileManager(self.mock_client)

    def test_client_exists(self):
        token = GoogleDriveUserToken(
            user=get_user_model().objects.get(username="username"),
            credentials=Credentials(token='asdf', refresh_token='1234')
        )
        token.save()

        fmgr = GoogleDriveFileManager(self.mock_client)
        self.assertEqual(fmgr.googledrive_api, self.mock_client.user.googledrive_user_token.client)


class TestNeurodataFileManager(TestCase):
    fixtures = ['users', 'auth']
    maxDiff = None

    def test_init_with_client(self):
        mock_request = MagicMock()

        neuro_fmgr = NeurodataFileManager(mock_request)
        self.assertEqual(neuro_fmgr._ac, mock_request.user.agave_oauth.client)

    def test_requires_auth(self):
        mock_request = MagicMock()
        neuro_fmgr = NeurodataFileManager(mock_request)
        self.assertTrue(neuro_fmgr.requires_auth)
    
    def test_serializer_cls(self):
        from json.encoder import JSONEncoder
        mock_request = MagicMock()
        neuro_fmgr = NeurodataFileManager(mock_request)
        self.assertEquals(neuro_fmgr.encoder_cls, JSONEncoder)

    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    def test_collection_listing(self, mock_get):
        mock_request = MagicMock()
        mock_get().json.return_value = {
            "collections": [
                "collection1"
            ]
        }

        neuro_fmgr = NeurodataFileManager(mock_request)
        listing = neuro_fmgr.listing('collection/collection')

        expected_url = 'https://api.boss.neurodata.io/v1/collection'
        expected_header = {'Authorization': 'Token test'}
        mock_get.assert_called_with(expected_url, headers=expected_header)

        listing_return_val = {
            'description': None,
            'children': [
                {'name': 'collection1',
                'path': 'collection',
                'type': 'folder',
                'permissions': 'READ',
                'system': 'collection'}
            ],
            'format': 'folder',
            'mimeType': 'text/directory',
            'name': '',
            'path': '/',
            'system': None,
            'permissions': 'READ'
        }
        self.assertEqual(listing, listing_return_val)

    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    def test_experiment_listing(self, mock_get):
        mock_request = MagicMock()
        mock_get().json.return_value = {
            "name": "collection1",
            "description": "test collection",
            "experiments": [
                "experiment1"
            ],
            "creator": "testcreator"
        }

        neuro_fmgr = NeurodataFileManager(mock_request)
        listing = neuro_fmgr.listing('experiment/collection/collection1')

        expected_url = 'https://api.boss.neurodata.io/v1/collection/collection1'
        expected_header = {'Authorization': 'Token test'}
        mock_get.assert_called_with(expected_url, headers=expected_header)

        listing_return_val = {
            'description': 'test collection',
            'children': [
                {'name': 'experiment1',
                'path': 'collection/collection1',
                'type': 'folder',
                'permissions': 'READ',
                'system': 'experiment'}
            ],
            'format': 'folder',
            'mimeType': 'text/directory',
            'name': '',
            'path': '/',
            'system': None,
            'permissions': 'READ'
        }
        self.assertEqual(listing, listing_return_val)

    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    def test_channel_listing(self, mock_get):
        mock_request = MagicMock()
        mock_get().json.return_value = {
            "channels": [
                "channel1"
            ],
            "name": "experiment1",
            "description": "test experiment",
            "collection": "collection1",
            "coord_frame": "frame1",
            "num_hierarchy_levels": 3,
            "hierarchy_method": "anisotropic",
            "num_time_samples": 1,
            "time_step": None,
            "time_step_unit": "",
            "creator": "testuser"
        }

        neuro_fmgr = NeurodataFileManager(mock_request)
        listing = neuro_fmgr.listing('channel/collection/collection1/experiment/experiment1')

        expected_url = 'https://api.boss.neurodata.io/v1/collection/collection1/experiment/experiment1'
        expected_header = {'Authorization': 'Token test'}
        mock_get.assert_called_with(expected_url, headers=expected_header)

        listing_return_val = {
            'description': 'test experiment',
            'children': [
                {'name': 'channel1',
                'path': 'collection/collection1/experiment/experiment1',
                'type': 'file',
                'permissions': 'READ',
                'system': 'channel'}
            ],
            'format': 'folder',
            'mimeType': 'text/directory',
            'name': '',
            'path': '/',
            'system': None,
            'permissions': 'READ'
        }
        self.assertEqual(listing, listing_return_val)
    
    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    def test_channel_preview_listing(self, mock_get):
        mock_request = MagicMock()
        mock_get().json.return_value = {
            "name": "channel1",
            "description": "test channel description",
            "experiment": "experiment1",
            "default_time_sample": 0,
            "type": "image",
            "base_resolution": 0,
            "datatype": "uint8",
            "creator": "testuser",
            "sources": [],
            "downsample_status": "DOWNSAMPLED",
            "related": []
        }

        neuro_fmgr = NeurodataFileManager(mock_request)
        listing = neuro_fmgr.listing('channel.preview/collection/collection1/experiment/experiment1/channel/channel1')

        expected_url = 'https://api.boss.neurodata.io/v1/collection/collection1/experiment/experiment1/channel/channel1'
        expected_header = {'Authorization': 'Token test'}
        mock_get.assert_called_with(expected_url, headers=expected_header)

        listing_return_val = {
            'description': 'test channel description',
            'children': [{
                'name': 'channel1',
                'path': 'collection/collection1/experiment/experiment1/channel/channel1',
                'permissions': 'READ',
                'system': 'channel',
                'description': 'test channel description',
                'default_time_sample': 0,
                'type': 'image',
                'base_resolution': 0,
                'datatype': 'uint8',
                'creator': 'testuser',
                'downsample_status': 'DOWNSAMPLED'
            }],
            'format': 'folder',
            'mimeType': 'text/directory',
            'name': '',
            'path': '/',
            'system': None,
            'permissions': 'READ'
        }
        self.assertEqual(listing, listing_return_val)

    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    @patch('portal.apps.data_depot.managers.neurodata.base64')
    def test_download(self, mock_b64, mock_get):
        mock_request = MagicMock()
        req_body = {'options':  {
            'collection': 'collection1',
            'experiment': 'experiment1',
            'channel': 'channel1',
            'resolution': 0,
            'x_start': 0,  
            'x_stop': 100,
            'y_start': 0,
            'y_stop': 100,
            'z_start': 0,
            'z_stop': 100,
        }}
        neuro_fmgr = NeurodataFileManager(mock_request)
        neuro_fmgr.download('path', req_body)
        expected_url = 'https://api.boss.neurodata.io/v1/cutout/collection1/experiment1/channel1/0/0:100/0:100/0:100/'
        expected_header = {'Authorization': 'Token test', "Accept": "image/jpeg"}
        mock_get.assert_called_with(expected_url, headers=expected_header) 
        

    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    def test_coord_frame(self, mock_get):
        mock_request = MagicMock()
        neuro_fmgr = NeurodataFileManager(mock_request)
        mock_get().json.return_value = {'coord_frame': 'frame1'}

        expected_header = {'Authorization': 'Token test'}
        expected_expt_url = 'https://api.boss.neurodata.io/v1/collection/collection1/experiment/experiment1'
        expected_coord_url = 'https://api.boss.neurodata.io/v1/coord/frame1'
        
        neuro_fmgr.coord_frame('channel/collection/collection1/experiment/experiment1') 

        mock_get.assert_any_call(expected_expt_url, headers=expected_header)
        mock_get.assert_any_call(expected_coord_url, headers=expected_header)
    
    @patch('portal.apps.data_depot.managers.neurodata.AgaveFileManager.upload')
    @patch('portal.apps.data_depot.managers.neurodata.BytesIO')
    @patch('portal.apps.data_depot.managers.neurodata.requests.get')
    def test_data_upload(self, mock_get, mock_bytes, mock_upload):
        req_body = {'options':  {
            'type': '.jpg',
            'targetSystem': 'test.system',
            'targetPath': 'test.path',
            'filename': 'testfile',
            'collection': 'collection1',
            'experiment': 'experiment1',
            'channel': 'channel1',
            'resolution': 0,
            'x_start': 0,  
            'x_stop': 100,
            'y_start': 0,
            'y_stop': 100,
            'z_start': 0,
            'z_stop': 100,
        }}

        mock_request = MagicMock()
        neuro_fmgr = NeurodataFileManager(mock_request)
        neuro_fmgr.upload('path', req_body)


        expected_url = 'https://api.boss.neurodata.io/v1/cutout/collection1/experiment1/channel1/0/0:100/0:100/0:100/'
        expected_header = {'Authorization': 'Token test', "Accept": "image/jpeg"}
        mock_get.assert_called_with(expected_url, headers=expected_header)

        req_body['options']['type'] = 'blosc'
        neuro_fmgr.upload('path', req_body)
        expected_header = {'Authorization': 'Token test', "Accept": "application/blosc"}
        mock_get.assert_called_with(expected_url, headers=expected_header)

        req_body['options']['type'] = 'blosc-python'
        neuro_fmgr.upload('path', req_body)
        expected_header = {'Authorization': 'Token test', "Accept": "application/blosc-python"}
        mock_get.assert_called_with(expected_url, headers=expected_header)


