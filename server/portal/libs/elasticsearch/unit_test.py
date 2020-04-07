from mock import patch, call, MagicMock
from django.test import TestCase
from portal.libs.elasticsearch.exceptions import DocumentNotFound

from portal.libs.elasticsearch.indexes import setup_files_index, setup_indexes, IndexedFile
from portal.libs.elasticsearch.utils import index_listing, index_level


class TestESSetupMethods(TestCase):
    def setUp(self):
        return

    @patch('portal.libs.elasticsearch.indexes.Index')
    def test_generic_setup_if_index_exists(self, mock_index):
        # mock_index.return_value='INDEX'
        mock_index.return_value.exists.return_value = True
        setup_indexes('type', False, False)
        mock_index.assert_called_with('test-staging-type')

    @patch('portal.libs.elasticsearch.indexes.Index')
    @patch('portal.libs.elasticsearch.indexes.index_time_string')
    def test_generic_setup_if_no_index_exists(self, mock_time_string, mock_index):
        # mock_index.return_value='INDEX'
        mock_time_string.return_value = 'TIME_NOW'
        mock_index.return_value.exists.return_value = False
        setup_indexes('type', False, False)
        mock_index.assert_has_calls([
            call('test-staging-type'),
            call().exists(),
            call().exists(),  # from while loop
            call('test-staging-type-TIME_NOW'),
            call().aliases(**{'test-staging-type': {}})
        ])

    @patch('portal.libs.elasticsearch.indexes.setup_indexes')
    @patch('portal.libs.elasticsearch.indexes.index_time_string')
    def test_files_setup(self, mock_timestring, mock_setup):

        setup_files_index()
        mock_setup.assert_called_with('files', False, False)

    """
    @patch('portal.libs.elasticsearch.indexes.setup_indexes')
    @patch('portal.libs.elasticsearch.indexes.index_time_string')
    def test_projects_setup(self, mock_timestring, mock_setup):
        mock_timestring.return_value = 'TIME_NOW'
        setup_projects_index()
        mock_setup.assert_called_with('projects', False, False)
    """


class TestESUtils(TestCase):

    @patch('portal.libs.elasticsearch.utils.MultiSearch')
    @patch('portal.libs.elasticsearch.utils.bulk')
    @patch('portal.libs.elasticsearch.utils.current_time')
    @patch('portal.libs.elasticsearch.utils.get_connection')
    def test_index_listing_no_res(self, mock_conn, mock_time, mock_bulk, mock_search):
        files = [
            {'system': 'test.system', 'path': '/test/file1'},
        ]
        mock_conn.return_value = 'default'
        mock_time.return_value = 'TIME_NOW'
        mock_search().add().execute.return_value = [[]]

        index_listing(files)

        mock_bulk.assert_called_once_with(
            'default', [{'_index': 'test-staging-files',
                         'doc': {'system': 'test.system',
                                 'path': '/test/file1',
                                 'lastUpdated': 'TIME_NOW',
                                 'basePath': '/test'},
                         '_op_type': 'index'}])

    @patch('portal.libs.elasticsearch.utils.MultiSearch')
    @patch('portal.libs.elasticsearch.utils.bulk')
    @patch('portal.libs.elasticsearch.utils.current_time')
    @patch('portal.libs.elasticsearch.utils.get_connection')
    def test_index_listing_multi_res(self, mock_conn, mock_time, mock_bulk, mock_search):
        files = [
            {'system': 'test.system', 'path': '/test/file1'},
        ]

        res1 = MagicMock()
        res1.meta.id = 'id1'
        res2 = MagicMock()
        res2.meta.id = 'id2'

        mock_conn.return_value = 'default'
        mock_time.return_value = 'TIME_NOW'
        mock_search().add().execute.return_value = [[res1, res2]]

        index_listing(files)

        mock_bulk.assert_called_once_with(
            'default', [{'_index': 'test-staging-files',
                         '_id': 'id1',
                         'doc': {'system': 'test.system',
                                 'path': '/test/file1',
                                 'lastUpdated': 'TIME_NOW',
                                 'basePath': '/test'},
                         '_op_type': 'update'},
                        {'_index': 'test-staging-files',
                         '_id': 'id2',
                         '_op_type': 'delete'}])

    @patch('portal.libs.elasticsearch.utils.IndexedFile.list_children')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.from_path')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.save')
    def test_index_level_with_save(self, mock_save, mock_get, mock_children):
        mock_children.return_value = []
        mock_get.side_effect = DocumentNotFound
        testfolder = {'system': 'test.system', 'path': '/test/folder'}

        index_level('/test', [testfolder], [], 'test.system')

        mock_save.assert_called_once_with()

    @patch('portal.libs.elasticsearch.utils.IndexedFile.list_children')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.from_path')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.update')
    def test_index_level_with_update(self, mock_update, mock_get, mock_children):
        mock_children.return_value = []
        mock_get.return_value = IndexedFile()
        testfolder = {'system': 'test.system', 'path': '/test/folder'}

        index_level('/test', [testfolder], [], 'test.system')

        mock_update.assert_called_once_with(**{'system': 'test.system',
                                               'path': '/test/folder',
                                               'basePath': '/test'})

    @patch('portal.libs.elasticsearch.utils.IndexedFile.list_children')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.from_path')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.update')
    @patch('portal.libs.elasticsearch.utils.IndexedFile.delete_recursive')
    def test_index_level_with_delete(self, mock_delete, mock_update, mock_get, mock_children):
        mock_children.return_value = [IndexedFile(path='/random/path')]
        mock_get.return_value = IndexedFile()
        testfolder = {'system': 'test.system', 'path': '/test/folder'}

        index_level('/test', [testfolder], [], 'test.system')

        mock_delete.assert_called_once_with()
