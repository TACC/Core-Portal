from mock import patch, MagicMock
from requests.exceptions import HTTPError
from django.test import TestCase
from agavepy.agave import AttrDict
from elasticsearch_dsl import Q
from elasticsearch_dsl.response import Hit
from portal.libs.agave.operations import listing, search, mkdir, move, copy, rename, makepublic
from portal.exceptions.api import ApiException


class TestOperations(TestCase):

    @patch('portal.libs.agave.operations.agave_listing_indexer')
    def test_listing(self, mock_indexer):
        client = MagicMock()
        mock_listing = [AttrDict({'system': 'test.system',
                                  'path': '/path/to/file'})]
        client.files.list.return_value = mock_listing
        ls = listing(client, 'test.system', '/path/to/file')

        client.files.list.assert_called_with(systemId='test.system',
                                             filePath='/path/to/file',
                                             offset=1,
                                             limit=100)

        mock_indexer.delay.assert_called_with([{'system': 'test.system',
                                                'path': '/path/to/file'}])

        self.assertEqual(ls, {'listing': [{'system': 'test.system',
                                           'path': '/path/to/file'}],
                              'reachedEnd': True})

    @patch('portal.libs.agave.operations.IndexedFile.search')
    def test_search(self, mock_search):
        mock_hit = Hit({})
        mock_hit.system = 'test.system'
        mock_hit.path = '/path/to/file'

        mock_result = MagicMock()
        mock_result.__iter__.return_value = [mock_hit]
        mock_result.hits.total.value = 1
        mock_search().query().filter().extra().execute\
            .return_value = mock_result

        search_res = search(None, 'test.system', '/path', query_string='query')

        mock_search().query.assert_called_with(Q("query_string", query='query',
                                                 fields=["name"],
                                                 minimum_should_match='100%',
                                                 default_operator='or') |
                                               Q("query_string", query='query',
                                                 fields=[
                                                     "name._exact, name._pattern"],
                                                 default_operator='and'))
        mock_search().query().filter.assert_called_with('term', **{'system._exact': 'test.system'})
        mock_search().query().filter().extra.assert_called_with(from_=int(0), size=int(100))
        self.assertEqual(search_res, {'listing':
                                      [{'system': 'test.system',
                                        'path': '/path/to/file'}],
                                      'reachedEnd': True, 'count': 1})

    @patch('portal.libs.agave.operations.agave_indexer')
    def test_mkdir(self, mock_indexer):
        client = MagicMock()
        mkdir(client, 'test.system', '/root', 'testfolder')
        client.files.manage.assert_called_with(systemId='test.system', filePath='/root', body={'action': 'mkdir', 'path': 'testfolder'})

        mock_indexer.apply_async.assert_called_with(kwargs={'systemId': 'test.system', 'filePath': '/root', 'recurse': False})

    @patch('portal.libs.agave.operations.move')
    def test_rename(self, mock_move):
        client = MagicMock()
        rename(client, 'test.system', '/path/to/file', 'newname')
        mock_move.assert_called_with(client,
                                     src_system='test.system',
                                     src_path='/path/to/file',
                                     dest_system='test.system', dest_path='/path/to',
                                     file_name='newname')

    @patch('portal.libs.agave.operations.agave_indexer')
    def test_move(self, mock_indexer):
        client = MagicMock()
        client.files.list.side_effect = HTTPError(response=MagicMock(status_code=404))
        client.files.manage.return_value = {'nativeFormat': 'dir'}

        move(client, 'test.system', '/path/to/src', 'test.system', '/path/to/dest')

        client.files.manage.assert_called_with(systemId='test.system', filePath='/path/to/src', body={
            'action': 'move', 'path': 'path/to/dest/src'
        })

        self.assertEqual(mock_indexer.apply_async.call_count, 3)

    def test_cross_system_move(self):
        client = MagicMock()
        with self.assertRaises(ApiException):
            move(client, 'test.system', '/path/to/src', 'other.system', '/path/to/dest')

    @patch('portal.libs.agave.operations.agave_indexer')
    def test_copy(self, mock_indexer):
        client = MagicMock()
        client.files.list.side_effect = HTTPError(response=MagicMock(status_code=404))
        client.files.manage.return_value = {'nativeFormat': 'dir'}

        copy(client, 'test.system', '/path/to/src', 'test.system', '/path/to/dest')

        client.files.manage.assert_called_with(systemId='test.system', filePath='/path/to/src', body={
            'action': 'copy', 'path': 'path/to/dest/src'
        })

        self.assertEqual(mock_indexer.apply_async.call_count, 2)

    @patch('portal.libs.agave.operations.copy')
    def test_make_public(self, mock_copy):
        client = MagicMock()

        makepublic(client, 'test.system', '/path/to/src')

        mock_copy.assert_called_with(client,
                                     'test.system',
                                     '/path/to/src',
                                     'portal.storage.public', '/')
