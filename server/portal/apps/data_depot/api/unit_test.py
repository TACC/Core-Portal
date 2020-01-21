import json
from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings
from portal.apps.data_depot.api.views import FileMediaView

class TestFileMediaView(TestCase):
    """Tests for portal.apps.data_depot.api.views.FileMediaView"""
    
    @patch('portal.apps.data_depot.api.views.get_manager')
    def test_put_actions(self, mock_get):
        """Having more than 3 tests for individual PUT actions causes a segfault
         for some reason, so this has to be 1 big test"""
        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'public_url', 'refresh': False}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().public_url.assert_called_once_with('cep.test//testfile.txt', refresh=False)
    
        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'copy', 'system': 'cep.test.copy', 'path': '/copy/path'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().copy.assert_called_once_with('cep.test//testfile.txt', 'cep.test.copy/copy/path')

        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'download'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().download.assert_called_once_with('cep.test//testfile.txt', preview=False)

        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'mkdir', 'name': 'testdir'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().mkdir.assert_called_once_with('cep.test//testfile.txt', 'testdir')

        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'move', 'system': 'cep.move', 'path': '/path/to/new'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().move.assert_called_once_with('cep.test//testfile.txt', 'cep.move/path/to/new')

        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'rename', 'name': 'newname.txt'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().rename.assert_called_once_with('cep.test//testfile.txt', 'newname.txt')

        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'trash'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().trash.assert_called_once_with('cep.test//testfile.txt')

        resp = self.client.put("/api/data-depot/files/media/my-data/cep.test//testfile.txt", 
            data=json.dumps({'action': 'preview'}), 
            content_type='application/json', 
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        mock_get().download.assert_called_with('cep.test//testfile.txt', preview=True)
        
    

    

