from mock import patch, MagicMock
from django.test import TestCase
from tapipy.tapis import TapisResult
from elasticsearch_dsl import Q
from elasticsearch_dsl.response import Hit
from portal.libs.agave.operations import listing, search, mkdir, move, copy, rename, makepublic
from portal.exceptions.api import ApiException


class TestOperations(TestCase):

    @patch('portal.libs.agave.operations.tapis_listing_indexer')
    def test_listing(self, mock_indexer):
        client = MagicMock()
        mock_tapis_listing = [TapisResult(**{
            "mimeType": None,
            "type": "file",
            "url": "tapis://cloud.data/path/to/file",
            "lastModified": "2020-04-23T06:25:56Z",
            "name": "file",
            "path": '/path/to/file',
            "size": 1
        })]

        client.files.listFiles.return_value = mock_tapis_listing
        ls = listing(client, 'test.system', '/path/to/file', 1)

        client.files.listFiles.assert_called_with(systemId='test.system',
                                                  path='/path/to/file',
                                                  pattern='',
                                                  offset=1,
                                                  limit=100,
                                                  headers={'X-Tapis-Tracking-ID': ''})

        mock_response_listing = [{'system': 'test.system',
                                  'type': 'file',
                                  'format': 'raw',
                                  'mimeType': None,
                                  'path': '/path/to/file',
                                  'name': 'file',
                                  'length': 1,
                                  'lastModified': '2020-04-23T06:25:56Z',
                                  '_links': {
                                      'self': {
                                          'href': 'tapis://cloud.data/path/to/file'
                                      }
                                    }
                                  }]

        mock_indexer.delay.assert_called_with(mock_response_listing)

        self.assertEqual(ls, {'listing': mock_response_listing,
                              'reachedEnd': True})

    @patch('portal.libs.agave.operations.listing')
    @patch('portal.libs.agave.operations.IndexedFile.search')
    def test_search(self, mock_search, mock_listing):
        mock_hit = Hit({})
        mock_hit.system = 'test.system'
        mock_hit.path = '/path/to/file'

        mock_result = MagicMock()
        mock_result.__iter__.return_value = [mock_hit]
        mock_result.hits.total.value = 1
        mock_search().query().filter().filter().extra().execute\
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

        mock_search().query().filter.assert_called_with('prefix', **{'path._exact': 'path'})
        mock_search().query().filter().filter.assert_called_with('term', **{'system._exact': 'test.system'})
        mock_search().query().filter().filter().extra.assert_called_with(from_=int(0), size=int(100))
        self.assertEqual(search_res, {'listing':
                                      [{'system': 'test.system',
                                        'path': '/path/to/file'}],
                                      'reachedEnd': True, 'count': 1})

    @patch('portal.libs.agave.operations.tapis_indexer')
    def test_mkdir(self, mock_indexer):
        client = MagicMock()
        client.access_token.access_token = 'my_access_token'

        mkdir(client, 'test.system', '/root', 'testfolder')

        client.files.mkdir.assert_called_with(systemId='test.system', path='/root/testfolder')

        mock_indexer.apply_async.assert_called_with(kwargs={'access_token': 'my_access_token', 'systemId': 'test.system',
                                                            'filePath': '/root', 'recurse': False})

    @patch('portal.libs.agave.operations.move')
    def test_rename(self, mock_move):
        client = MagicMock()
        rename(client, 'test.system', '/path/to/file', 'newname')
        mock_move.assert_called_with(client,
                                     src_system='test.system',
                                     src_path='/path/to/file',
                                     dest_system='test.system', dest_path='/path/to',
                                     file_name='newname')

    @patch('portal.libs.agave.operations.tapis_indexer')
    def test_move(self, mock_indexer):
        client = MagicMock()
        client.files.moveCopy.return_value = {'status': 'success'}
        client.files.getStatInfo.return_value = TapisResult(**{'dir': True})

        move(client, 'test.system', '/path/to/src', 'test.system', '/path/to/dest')

        client.files.moveCopy.assert_called_with(systemId='test.system',
                                                 path='/path/to/src',
                                                 operation='MOVE',
                                                 newPath='path/to/dest/src',
                                                 headers={'X-Tapis-Tracking-ID': ''})

        self.assertEqual(mock_indexer.apply_async.call_count, 3)

    def test_cross_system_move(self):
        client = MagicMock()
        with self.assertRaises(ApiException):
            move(client, 'test.system', '/path/to/src', 'other.system', '/path/to/dest')

    @patch('portal.libs.agave.operations.tapis_indexer')
    def test_copy(self, mock_indexer):
        client = MagicMock()
        client.files.moveCopy.return_value = {'status': 'success'}

        copy(client, 'test.system', '/path/to/src', 'test.system', '/path/to/dest')

        client.files.moveCopy.assert_called_with(systemId='test.system',
                                                 path='/path/to/src',
                                                 operation='COPY',
                                                 newPath='path/to/dest/src',
                                                 headers={'X-Tapis-Tracking-ID': ''})

        self.assertEqual(mock_indexer.apply_async.call_count, 2)

    @patch('portal.libs.agave.operations.copy')
    def test_make_public(self, mock_copy):
        client = MagicMock()

        makepublic(client, 'test.system', '/path/to/src')

        mock_copy.assert_called_with(client,
                                     'test.system',
                                     '/path/to/src',
                                     'cloud.data', '/')
