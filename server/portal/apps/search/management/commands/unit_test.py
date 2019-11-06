from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.management import call_command
import datetime


class TestSwapReindex(TestCase):

    def setUp(self):
        self.patch_setup = patch('portal.apps.search.management.commands.reindex-files.setup_files_index')
        self.patch_connections = patch('portal.apps.search.management.commands.reindex-files.connections')
        self.patch_elasticsearch = patch('portal.apps.search.management.commands.reindex-files.elasticsearch')

        self.mock_setup = self.patch_setup.start()
        self.mock_connections = self.patch_connections.start()
        self.mock_elasticsearch = self.patch_elasticsearch.start()

        self.addCleanup(self.patch_setup.stop)
        self.addCleanup(self.patch_connections.stop)
        self.addCleanup(self.patch_elasticsearch.stop)

    @patch('portal.apps.search.management.commands.reindex-files.Command.handle')
    def test_working(self, mock_handle):
        call_command('reindex-files')
        self.assertEqual(mock_handle.call_count, 1)

    @patch('portal.apps.search.management.commands.reindex-files.input')
    def test_raises_when_user_does_not_proceed(self, mock_input):
        mock_input.return_value = 'n'

        with self.assertRaises(SystemExit):
            call_command('reindex-files')

    @patch('portal.apps.search.management.commands.reindex-files.Index')
    @patch('portal.apps.search.management.commands.reindex-files.input')
    def test_raises_exception_when_no_index(self, mock_input, mock_index):
        mock_input.return_value = 'Y'
        
        mock_index.return_value.get_alias.return_value.keys.side_effect = Exception
        
        with self.assertRaises(SystemExit):
            call_command('reindex-files')

    @patch('portal.apps.search.management.commands.reindex-files.Index')
    @patch('portal.apps.search.management.commands.reindex-files.input')
    def test_performs_reindex_from_default_to_reindex(self, mock_input, mock_index):
        mock_input.return_value = 'Y'

        mock_index.return_value.get_alias.return_value.keys.side_effect = [['DEFAULT_NAME'], ['REINDEX_NAME']]

        mock_client = MagicMock()
        self.mock_elasticsearch.Elasticsearch.return_value = mock_client

        call_command('reindex-files')

        self.mock_elasticsearch.helpers.reindex.assert_called_with(mock_client, 'DEFAULT_NAME', 'REINDEX_NAME')

    @patch('portal.apps.search.management.commands.reindex-files.Index')
    @patch('portal.apps.search.management.commands.reindex-files.input')
    def test_performs_swap_with_correct_args(self, mock_input, mock_index):
        mock_input.return_value = 'Y'

        mock_index.return_value.get_alias.return_value.keys.side_effect = [['DEFAULT_NAME'], ['REINDEX_NAME']]

        call_command('reindex-files')

        mock_alias = {
            'actions': [
                {'remove': {'index': 'DEFAULT_NAME', 'alias': 'test-staging-files'}},
                {'remove': {'index': 'REINDEX_NAME', 'alias': 'test-staging-files-reindex'}},
                {'add': {'index': 'DEFAULT_NAME', 'alias': 'test-staging-files-reindex'}},
                {'add': {'index': 'REINDEX_NAME', 'alias': 'test-staging-files'}},
            ]
        }
        self.mock_elasticsearch.Elasticsearch().indices.update_aliases.assert_called_with(mock_alias)

    @patch('portal.apps.search.management.commands.reindex-files.Index')
    @patch('portal.apps.search.management.commands.reindex-files.input')
    def test_cleanup(self, mock_input, mock_index):
        mock_input.return_value = 'Y'

        mock_index.return_value.get_alias.return_value.keys.side_effect = [['DEFAULT_NAME'], ['REINDEX_NAME'], ['REINDEX_NAME']]
        opts = {'cleanup': True}

        call_command('reindex-files', **opts)

        self.assertEqual(mock_index.return_value.delete.call_count, 1)

