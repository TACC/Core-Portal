from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings
from pytest import raises
from portal.libs.elasticsearch.docs.base import IndexedFile
from portal.libs.elasticsearch.exceptions import DocumentNotFound


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

    @patch('portal.libs.elasticsearch.docs.base.Document.search')
    @patch('portal.libs.elasticsearch.docs.base.Document.get')
    def test_from_path_no_results(self, mock_get, mock_search):
        mock_search().filter().filter().scan().__next__.side_effect = StopIteration
        with raises(DocumentNotFound):
            IndexedFile.from_path('test.system', '/test/path')

    @patch('portal.libs.elasticsearch.docs.base.Document.search')
    @patch('portal.libs.elasticsearch.docs.base.Document.get')
    def test_from_path_with_results(self, mock_get, mock_search):
        res1 = MagicMock()
        res1.meta.id = 'id1'
        res2 = MagicMock()
        res2.meta.id = 'id2'

        def scan_side_effect():
            yield res1
            yield res2

        mock_search().filter().filter().scan.side_effect = scan_side_effect
        IndexedFile.from_path('test.system', '/test/path')
        mock_get.assert_has_calls([call('id2'), call().delete(), call('id1')])
        mock_get().delete.assert_called_once()

    @patch('portal.libs.elasticsearch.docs.base.IndexedFile.children')
    def test_list_children(self, mock_children):
        IndexedFile.list_children('test.system', '/test/path')
        mock_children.assert_called_once()

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
