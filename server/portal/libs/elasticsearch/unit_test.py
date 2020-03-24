from mock import Mock, patch, MagicMock, PropertyMock, call
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings
from portal.libs.elasticsearch.indexes import setup_files_index, setup_projects_index, setup_indexes
from portal.libs.elasticsearch.exceptions import DocumentNotFound


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
            call().exists(), # from while loop
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
        mock_timestring.return_value = 'TIME_NOW'
        setup_projects_index()
        mock_setup.assert_called_with('projects', False, False)