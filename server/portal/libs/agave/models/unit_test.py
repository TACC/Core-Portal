"""
.. :module:: portal.libs.agave.models.unit_test
   :synopsis: Unit tests for Agave model representation.
"""
import logging
import os
import json
import copy
from unittest import skip
from mock import patch
from django.test import TestCase
from django.conf import settings
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.models.metadata import Metadata

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class TestAgaveFile(TestCase):
    """Test Agave File"""

    @classmethod
    def setUpClass(cls):
        super(TestAgaveFile, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.AgaveOAuthToken.client',
            autospec=True
        )
        cls.magave = cls.magave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.magave_patcher.stop()

    def setUp(self):
        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/agave')

        with open(
            os.path.join(
                agave_path,
                'files',
                'file.json'
                )
        ) as _file:
            self.agave_file = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'directory.json'
                )
        ) as _file:
            self.agave_directory = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'listing.json'
                )
        ) as _file:
            self.agave_listing = json.load(_file)

    def test_base_file_init(self):
        """Test BaseFile __init__"""
        agf = BaseFile(self.magave, **self.agave_file)
        self.assertEqual(
            self.agave_file['name'],
            agf.name
        )
        self.assertEqual(
            self.agave_file['path'],
            agf.path
        )
        self.assertEqual(
            self.agave_file['system'],
            agf.system
        )
        self.assertEqual(
            self.agave_file['format'],
            agf.format
        )
        self.assertEqual(
            self.agave_file['type'],
            agf.type
        )
        self.assertEqual(
            self.agave_file['length'],
            agf.length
        )

    @skip("Needs refactoring to not use AgaveAsyncResponse. Also not in use.")
    @patch('portal.libs.agave.models.files.AgaveAsyncResponse', autospec=True)
    @patch.object(BaseFile, 'listing')
    def test_file_import_data(self, bf_listing, async_response_cls):
        """Test BaseFile import_data."""
        afl = BaseFile(self.magave, **self.agave_directory)
        afl.import_data('from_system', 'from/path/to/file.txt')
        self.magave.files.importData.return_value = {
            'path': 'result_path'
        }
        self.magave.files.importData.assert_called_with(
            systemId=self.agave_file['system'],
            filePath=os.path.dirname(self.agave_file['path']),
            fileName='file.txt',
            urlToIngest='agave://{}/{}'.format(
                'from_system',
                'from/path/to/file.txt'
            )
        )

    def test_copy(self):
        """Test file copy."""
        self.magave.files.manage.return_value = {'path': 'path/to/destiny'}
        afl = BaseFile(self.magave, **self.agave_file)
        afl.copy('path/to/destiny')
        self.magave.files.manage.assert_called_with(
            systemId=afl.system,
            filePath=afl.path,
            body={
                'action': 'copy',
                'path': os.path.join('path/to/destiny', afl.name)
            }
        )

    def test_delete(self):
        """Test delete."""
        afl = BaseFile(self.magave, **self.agave_file)
        afl.delete()
        self.magave.files.delete.assert_called_with(
            systemId=self.agave_file['system'],
            filePath=self.agave_file['path']
        )


class TestAgaveMetadata(TestCase):
    """Test Agave File"""

    @classmethod
    def setUpClass(cls):
        super(TestAgaveMetadata, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.AgaveOAuthToken.client',
            autospec=True
        )
        cls.magave = cls.magave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.magave_patcher.stop()

    def setUp(self):
        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/agave')

        with open(
            os.path.join(
                agave_path,
                'metadata',
                'metadata.json'
                )
        ) as _file:
            self.agave_metadata = json.load(_file)

        self._meta = copy.deepcopy(self.agave_metadata)
        self._meta['value'] = {
            'projectId': 'PRJ-123',
            'files': ['file1', 'file2']
        }
        self._meta.pop('_links')

    def test_metadata(self):
        """Test metadata intialization"""
        self.magave.meta.getMetadata.return_value = {}
        meta = Metadata(self.magave, **self._meta)

        self.assertEqual(
            meta.value.project_id,
            self._meta['value']['projectId']
        )
        self.assertEqual(
            meta.value.files,
            self._meta['value']['files']
        )
        self.assertEqual(
            meta.uuid,
            self._meta['uuid']
        )
        self.assertEqual(
            meta.name,
            self._meta['name']
        )

    def test_to_dict(self):
        """Test metadata's to_dict"""
        self.magave.meta.getMetadata.return_value = {}
        meta = Metadata(self.magave, **self._meta)

        self.assertDictEqual(
            self._meta,
            meta.to_dict()
        )

    def test_create(self):
        """Test metadata create."""
        agave_metadata = copy.deepcopy(self.agave_metadata)
        _meta = copy.deepcopy(self._meta)
        agave_metadata['value'] = _meta['value']
        _meta['uuid'] = None
        self.magave.meta.addMetadata.return_value = agave_metadata
        self.magave.meta.getMetadata.return_value = {}
        meta = Metadata.create(self.magave, _meta)

        self.assertDictEqual(
            meta.to_dict(),
            self._meta
        )
