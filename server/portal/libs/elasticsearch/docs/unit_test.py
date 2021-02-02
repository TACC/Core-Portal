from mock import patch, MagicMock
from django.test import TestCase
from portal.libs.elasticsearch.docs.base import IndexedFile, IndexedAllocation, IndexedProject


class TestIndexedFile(TestCase):

    def setUp(self):
        self.depth = 1

    @patch('portal.libs.elasticsearch.docs.base.Document.save')
    def test_save(self, mock_save):
        doc = IndexedFile()
        doc.save()
        mock_save.assert_called_once()

    @patch('portal.libs.elasticsearch.docs.base.Document.update')
    def test_update(self, mock_update):
        doc = IndexedFile()
        doc.update()
        mock_update.assert_called_once()

    @patch('portal.libs.elasticsearch.docs.base.Document.get')
    def test_from_path(self, mock_get):
        IndexedFile.from_path('test.system', '/path/to/file')
        mock_get.assert_called_once_with('c7765edebe9d7b715865b83a8319703975680be5a3f5f77503bdc47e7978429c')

    @patch('portal.libs.elasticsearch.docs.base.Document.search')
    @patch('portal.libs.elasticsearch.docs.base.Document.get')
    def test_children(self, mock_get, mock_search):
        res1 = MagicMock()
        res1.meta.id = 'id1'

        def scan_side_effect():
            yield res1

        mock_search().filter().filter().scan.side_effect = scan_side_effect

        doc = IndexedFile(system='test.system', path='/test/path')
        children = doc.children()
        next(children)
        mock_get.assert_called_once_with('id1')

    @patch('portal.libs.elasticsearch.docs.base.IndexedFile.children')
    @patch('portal.libs.elasticsearch.docs.base.Document.delete')
    def test_delete(self, mock_delete, mock_children):
        child = IndexedFile()

        # Return children only on the first call to prevent infinite recursion
        def children_side_effect():
            if self.depth > 0:
                self.depth -= 1
                yield child
            else:
                return

        mock_children.side_effect = children_side_effect

        parent = IndexedFile()
        parent.delete_recursive()

        self.assertEqual(mock_delete.call_count, 2)


class TestIndexedAllocation(TestCase):

    @patch('portal.libs.elasticsearch.docs.base.IndexedAllocation.get')
    def test_from_username(self, mock_get):
        IndexedAllocation.from_username('testuser')
        mock_get.assert_called_once_with('ae5deb822e0d71992900471a7199d0d95b8e7c9d05c40a8245a281fd2c1d6684')


class TestIndexedProject(TestCase):

    @patch('portal.libs.elasticsearch.docs.base.IndexedProject.get')
    def test_from_id(self, mock_get):
        IndexedProject.from_id('cep.test-2')
        mock_get.assert_called_once_with('cep.test-2')
