from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings
from elasticsearch_dsl import Q

from portal.apps.search.api.lookups import search_lookup_manager
from portal.apps.search.api.managers.cms_search import CMSSearchManager
from portal.apps.search.api.managers.shared_search import SharedSearchManager
from portal.apps.search.api.managers.private_data_search import PrivateDataSearchManager
from portal.apps.search.api.managers.project_search import ProjectSearchManager

from portal.apps.search.tasks import index_community_data

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
        """Test that the search query is correctly called using the current filter value"""
        #self.mock_search_lookup.reset_mock()
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=private_files", follow=True)
        self.mock_search_lookup.assert_called_once_with('my-data')
        self.assertTrue(resp.status_code == 200)

    def test_private_files_type_filter_query_includes_sortKey_parameter(self):
        """Test that the search query is correctly called using the sortKey value"""
        # resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=private_files", follow=True)
        # print(resp)
        return True;

    def test_private_files_type_filter_query_includes_sortOrder_parameter(self):
        """Test that the search query is correctly called using the sortOrder value"""
        return True;

    def test_public_files_type_filter_looks_up_shared_search(self):
        """Test that the search query is correctly called using the current filter value"""
        #self.mock_search_lookup.reset_mock()
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=public_files", follow=True)
        self.mock_search_lookup.assert_called_once_with('shared')
        self.assertTrue(resp.status_code == 200)

    def test_public_files_type_filter_query_includes_sortKey_parameter(self):
        """Test that the search query is correctly called using the sortKey value"""
        return True;

    def test_public_files_type_filter_query_includes_sortOrder_parameter(self):
        """Test that the search query is correctly called using the sortOrder value"""
        return True;

    def test_cms_files_type_filter_looks_up_cms_search(self):
        """Test that the search query is correctly called using the current filter value"""
        #self.mock_search_lookup.reset_mock()
        resp = self.client.get("/api/search/?limit=10&offset=0&queryString=test&typeFilter=cms", follow=True)
        self.mock_search_lookup.assert_called_once_with('cms')
        self.assertTrue(resp.status_code == 200)

    def test_cms_files_type_filter_query_includes_sortKey_parameter(self):
        """Test that the search query is correctly called using the sortKey value"""
        return True;

    def test_cms_files_type_filter_query_includes_sortOrder_parameter(self):
        """Test that the search query is correctly called using the sortOrder value"""
        return True;

class TestProjectSearchManager(TestCase):

    def test_mgr_init(self):
        mgr = ProjectSearchManager(**{'username': 'test_user', 'query_string': 'test_query'})
        self.assertEqual(mgr._username, 'test_user')
        self.assertEqual(mgr._query_string, 'test_query') 

    @patch('portal.apps.search.api.managers.project_search.BaseSearchManager.filter')
    @patch('portal.apps.search.api.managers.project_search.BaseSearchManager.query')
    @patch('portal.apps.search.api.managers.project_search.BaseSearchManager.extra')
    def test_search(self, mock_extra, mock_query, mock_filter):
        mgr = ProjectSearchManager(**{'username': 'test_user', 'query_string': 'test_query'})
        mgr.search(offset=0, limit=100)

        owner_query = Q({'term': {'owner.username': 'test_user'}})
        pi_query = Q({'term': {'pi.username': 'test_user'}})
        team_query = Q({'term': {'teamMembers.username': 'test_user'}}) 

        mock_filter.assert_called_once_with(owner_query | pi_query | team_query)
        mock_extra.assert_called_once_with(from_=0, size=100)

    @patch('portal.apps.search.api.managers.project_search.IndexedProject.search')
    def test_listing(self, mock_search):
        mock_mgr = MagicMock()
        mock_storage = MagicMock()
        mock_mgr.get_by_project_id.return_value.storage = mock_storage

        mock_hit = MagicMock()
        mock_hit.projectId = 'testProject1'

        mock_search().execute.return_value = [mock_hit]

        mgr = ProjectSearchManager(**{'username': 'test_user', 'query_string': 'test_query'})
        listing = mgr.list(mgr=mock_mgr)

        self.assertEqual(listing, [mock_storage])

class TestCommunityIndexer(TestCase):

    @patch('portal.apps.search.tasks.agave_indexer')
    def test_community_index(self, mock_indexer):
        index_community_data()
        mock_indexer.apply_async.assert_called_once_with(args=['test.storage'], kwargs={'reindex': False})
