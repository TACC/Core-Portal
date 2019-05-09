import os
import json
import datetime
from mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from portal.apps.data_depot.managers.base import AgaveFileManager
from portal.apps.data_depot.models import PublicUrl
from datetime import timedelta
from dateutil.tz import tzutc

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








    