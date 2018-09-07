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

class TestSiteSearchView(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.mock_filemgr_lookup_patcher = patch('portal.apps.data_depot.api.lookups.lookup_manager')
        cls.mock_filemgr_lookup = cls.mock_filemgr_lookup_patcher.start()

        cls.mock_privateSearch_patcher = patch('portal.apps.search.api.managers.private_data_search.PrivateDataSearchManager')
        cls.mock_privateSearch = cls.mock_privateSearch_patcher.start()

        cls.mock_sharedSearch_patcher = patch('portal.apps.search.api.managers.shared_search.SharedSearchManager')
        cls.mock_sharedSearch = cls.mock_sharedSearch_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_filemgr_lookup_patcher.stop()
        cls.mock_privateSearch_patcher.stop()
        cls.mock_sharedSearch_patcher.stop()

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
        user = get_user_model().objects.get(username='test')
        rq = HttpRequest()
        rq.user = user
        rq.session = Session()
        rq.GET = {'queryString': 'test'}

        FileListingView().get(rq, 'my-data', user_data)
        self.assertTrue(self.mock_privateSearch.called)
        self.mock_privateSearch.assert_called_with(rq)

        FileListingView().get(rq, 'shared', user_data)
        self.assertTrue(self.mock_sharedSearch.called)
        self.mock_sharedSearch.assert_called_with(rq)

class TestDataDepotSearchView(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.mock_filemgr_lookup_patcher = patch('portal.apps.data_depot.api.lookups.lookup_manager')
        cls.mock_filemgr_lookup = cls.mock_filemgr_lookup_patcher.start()

        cls.mock_privateSearch_patcher = patch('portal.apps.search.api.managers.private_data_search.PrivateDataSearchManager')
        cls.mock_privateSearch = cls.mock_privateSearch_patcher.start()

        cls.mock_sharedSearch_patcher = patch('portal.apps.search.api.managers.shared_search.SharedSearchManager')
        cls.mock_sharedSearch = cls.mock_sharedSearch_patcher.start()

        cls.mock_CMSSearch_patcher = patch('portal.apps.search.api.managers.cms_search.CMSSearchManager')
        cls.mock_CMSSearch = cls.mock_CMSSearch_patcher.start()

        #cls.mock_jsonResponse_patcher = patch('django.http.JsonResponse')
        #cls.mock_jsonResponse = cls.mock_jsonResponse_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_filemgr_lookup_patcher.stop()
        cls.mock_privateSearch_patcher.stop()
        cls.mock_sharedSearch_patcher.stop()
        cls.mock_CMSSearch_patcher.stop()
       # cls.mock_jsonResponse_patcher.stop()

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
        from portal.apps.search.api.views import SearchApiView
        user_data = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format("test")
        user = get_user_model().objects.get(username='test')
        rq = HttpRequest()
        rq.user = user
        rq.session = Session()
        rq.GET = {'queryString': 'test', 'type_filter': 'private_files', 'offset': 0, 'limit': 100 }

        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=private_files", follow=True)
        self.assertTrue(self.mock_privateSearch.called)
        
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=public_files", follow=True)
        self.assertTrue(self.mock_sharedSearch.called)

        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=cms", follow=True)
        self.assertTrue(self.mock_CMSSearch.called)
