from mock import patch, call
from django.test import TestCase
from elasticsearch_dsl import Q
from elasticsearch_dsl.response.hit import Hit

from portal.libs.elasticsearch.indexes import setup_files_index, setup_projects_index, setup_indexes
from portal.libs.elasticsearch.utils import index_listing, index_level, file_uuid_sha256, walk_children, grouper, delete_recursive


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

    @patch('portal.libs.elasticsearch.indexes.setup_indexes')
    @patch('portal.libs.elasticsearch.indexes.index_time_string')
    def test_projects_setup(self, mock_timestring, mock_setup):

        setup_projects_index()
        mock_setup.assert_called_with('projects', False, False)


class TestESUtils(TestCase):

    def test_uuid(self):
        uuid = file_uuid_sha256('test.system', '/path/to/file')
        self.assertEqual(uuid, 'c7765edebe9d7b715865b83a8319703975680be5a3f5f77503bdc47e7978429c')

    def test_grouper(self):
        g = grouper('ABCDEFG', 3, 'x')
        self.assertEqual(next(g), ('A', 'B', 'C'))
        self.assertEqual(next(g), ('D', 'E', 'F'))
        self.assertEqual(next(g), ('G', 'x', 'x'))
        with self.assertRaises(StopIteration):
            next(g)

    @patch('portal.libs.elasticsearch.docs.base.IndexedFile.search')
    def test_walk_children(self, mock_search):
        mock_search().filter().filter().scan.return_value = [Hit({})]

        children = walk_children('test.system', '/file/path', include_parent=True, recurse=True)
        next(children)
        mock_search().filter().filter.assert_called_with(Q({'prefix': {'basePath._exact': '/file/path'}}) | Q({'term': {'path._exact': '/file/path'}}))

        children = walk_children('test.system', '/file/path', include_parent=True, recurse=False)
        next(children)
        mock_search().filter().filter.assert_called_with(Q({'term': {'basePath._exact': '/file/path'}}) | Q({'term': {'path._exact': '/file/path'}}))

        children = walk_children('test.system', '/file/path', include_parent=False, recurse=True)
        next(children)
        mock_search().filter().filter.assert_called_with(Q({'prefix': {'basePath._exact': '/file/path'}}))

        children = walk_children('test.system', '/file/path', include_parent=False, recurse=False)
        next(children)
        mock_search().filter().filter.assert_called_with(Q({'term': {'basePath._exact': '/file/path'}}))

    @patch('portal.libs.elasticsearch.utils.walk_children')
    @patch('portal.libs.elasticsearch.utils.bulk')
    @patch('portal.libs.elasticsearch.utils.get_connection')
    def test_delete_recursive(self, mock_conn, mock_bulk, mock_children):
        mock_conn.return_value = 'default'

        def children_side_effect(*args, **kwargs):
            dummy_hit = Hit({})
            dummy_hit.system = 'test.system'
            dummy_hit.path = '/test/file'
            dummy_hit.meta.id = 'ABCDEF'
            yield dummy_hit
        mock_children.side_effect = children_side_effect

        test_op = {'_index': 'test-staging-files',
                   '_id': 'ABCDEF',
                   '_op_type': 'delete'}

        delete_recursive('test.system', '/test/file')
        mock_children.assert_called_once_with('test.system',
                                              '/test/file',
                                              recurse=True)

        mock_map = mock_bulk.call_args.args[1]
        self.assertEqual(next(mock_map), test_op)

    @patch('portal.libs.elasticsearch.utils.bulk')
    @patch('portal.libs.elasticsearch.utils.current_time')
    @patch('portal.libs.elasticsearch.utils.get_connection')
    def test_index_listing(self, mock_conn, mock_time, mock_bulk):
        files = [
            {'name': 'file1', 'system': 'test.system', 'path': '/test/file1'},
        ]
        mock_conn.return_value = 'default'
        mock_time.return_value = 'TIME_NOW'

        index_listing(files)

        mock_bulk.assert_called_once_with(
            'default', [{'_index': 'test-staging-files',
                         '_id': 'd9c58e96e64076fa1205c5ba23b1f5cbd609efc9d30683db00988ca95c47cfd0',
                         'doc': {'system': 'test.system',
                                 'name': 'file1',
                                 'path': '/test/file1',
                                 'lastUpdated': 'TIME_NOW',
                                 'basePath': '/test'},
                         '_op_type': 'update',
                         'doc_as_upsert': True}])

    @patch('portal.libs.elasticsearch.utils.index_listing')
    @patch('portal.libs.elasticsearch.utils.walk_children')
    @patch('portal.libs.elasticsearch.utils.delete_recursive')
    def test_index_level(self, mock_delete, mock_children, mock_index):

        def children_side_effect(*args, **kwargs):
            dummy_hit = Hit({})
            dummy_hit.system = 'test.system'
            dummy_hit.path = '/deleted/file'
            yield dummy_hit

        mock_children.side_effect = children_side_effect

        testfile = {'system': 'test.system', 'path': '/test/file', 'name': 'file'}
        testfolder = {'system': 'test.system', 'path': '/test/folder', 'name': 'folder'}

        index_level('/test', [testfolder], [testfile], 'test.system')

        mock_index.assert_called_once_with([testfolder, testfile])
        mock_delete.assert_called_once_with('test.system', '/deleted/file')
