from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings

from portal.apps.search.api.lookups import search_lookup_manager
from portal.apps.search.api.managers.cms_search import CMSSearchManager
from portal.apps.search.api.managers.shared_search import SharedSearchManager
from portal.apps.search.api.managers.private_data_search import PrivateDataSearchManager

from django.http import HttpRequest
from django.contrib.sessions.models import Session

class AttrDict(dict):

    def __getattr__(self, key):
        return self[key]

    def __setattr__(self, key, value):
        self[key] = value

class TestLookupManager(TestCase):
    
    def test_lookup_manager(self):
        lookup_my_data = search_lookup_manager('my-data')
        self.assertEqual(lookup_my_data, PrivateDataSearchManager)

        lookup_shared = search_lookup_manager('shared')
        self.assertEqual(lookup_shared, SharedSearchManager)

        lookup_cms = search_lookup_manager('cms')
        self.assertEqual(lookup_cms,CMSSearchManager)

class TestDataDepotSearchView(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.mock_filemgr_lookup_patcher = patch('portal.apps.data_depot.api.lookups.lookup_manager')
        cls.mock_filemgr_lookup = cls.mock_filemgr_lookup_patcher.start()

        cls.mock_privateSearch_patcher = patch('portal.apps.search.api.managers.private_data_search.PrivateDataSearchManager')
        cls.mock_privateSearch = cls.mock_privateSearch_patcher.start()

        cls.mock_sharedSearch_patcher = patch('portal.apps.search.api.managers.shared_search.SharedSearchManager')
        cls.mock_sharedSearch = cls.mock_sharedSearch_patcher.start()

        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_filemgr_lookup_patcher.stop()
        cls.mock_privateSearch_patcher.stop()
        cls.mock_sharedSearch_patcher.stop()
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

    def test_request_with_queryString_calls_search_lookup(self):
        from portal.apps.data_depot.api.views import FileListingView
        user_data = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format("test")
        shared_data = settings.AGAVE_COMMUNITY_DATA_SYSTEM
    
        self.client.login(username='test', password='test')

        self.assertFalse(self.mock_privateSearch.called)
        resp = self.client.get('/api/data-depot/files/listing/my-data/{}?queryString=test'.format(user_data), follow=True)
        self.assertTrue(self.mock_privateSearch.called)

        #self.client.login(username='test', password='test')
        
        self.assertFalse(self.mock_sharedSearch.called)
        resp = self.client.get('/api/data-depot/files/listing/shared/{}?queryString=tst'.format(shared_data), follow=True)
        self.assertTrue(self.mock_sharedSearch.called)
    
class TestSiteSearchView(TestCase):

    def setUp(self):

        self.mock_privateSearch_patcher = patch('portal.apps.search.api.views.PrivateDataSearchManager')
        self.mock_privateSearch = self.mock_privateSearch_patcher.start()

        self.mock_SharedSearch_patcher = patch('portal.apps.search.api.views.SharedSearchManager')
        self.mock_SharedSearch = self.mock_SharedSearch_patcher.start()

        self.mock_CMSSearch_patcher = patch('portal.apps.search.api.views.CMSSearchManager')
        self.mock_CMSSearch = self.mock_CMSSearch_patcher.start()

        self.mock_search_lookup_patcher = patch('portal.apps.search.api.views.search_lookup_manager')
        self.mock_search_lookup = self.mock_search_lookup_patcher.start()
        
        self.mock_privateSearch.return_value.search.return_value.count.return_value = 0
        self.mock_search_lookup.return_value.return_value.search.return_value.execute.return_value.hits.total = 0
        self.mock_SharedSearch.return_value.search.return_value.count.return_value = 0
        self.mock_CMSSearch.return_value.search.return_value.count.return_value = 0
        #cls.mock_jsonResponse_patcher = patch('django.http.JsonResponse')
        #cls.mock_jsonResponse = cls.mock_jsonResponse_patcher.start()

    #def tearDown(self):
    #   self.mock_search_lookup_patcher.stop() 

    # def tearDown(self):
    #     self.mock_search_lookup.reset_mock()

    def tearDown(self):
        self.mock_search_lookup_patcher.stop()
        self.mock_privateSearch_patcher.stop()
        self.mock_SharedSearch_patcher.stop()
        self.mock_CMSSearch_patcher.stop()
       # cls.mock_jsonResponse_patcher.stop()

    def test_private_files_type_filter_looks_up_my_data_search(self):
        #self.mock_search_lookup.reset_mock(
 
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=private_files", follow=True)

        self.mock_search_lookup.assert_called_once_with('my-data')
        self.assertTrue(resp.status_code == 200)


    def test_public_files_type_filter_looks_up_shared_search(self):
        #self.mock_search_lookup.reset_mock()
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=public_files", follow=True)
        self.mock_search_lookup.assert_called_once_with('shared')
        self.assertTrue(resp.status_code == 200)

    def test_cms_type_filter_looks_up_cms_search(self):
        #self.mock_search_lookup.reset_mock()
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=cms", follow=True)
        self.mock_search_lookup.assert_called_once_with('cms')
        self.assertTrue(resp.status_code == 200)
