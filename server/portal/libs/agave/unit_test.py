"""
.. :module:: portal.libs.agave.unit_test
   :synopsis: Unit tests for Agave libraries.
"""
import logging
import os
import json
import copy
from mock import patch, call
from django.test import TestCase
from django.conf import settings
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.serializers import (
    BaseAgaveFileSerializer,
    BaseAgaveSystemSerializer
)
from portal.libs.agave import utils as AgaveUtils

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class TestAgaveSerializers(TestCase):
    """Test Agave Serializers"""

    @classmethod
    def setUpClass(cls):
        super(TestAgaveSerializers, cls).setUpClass()
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
                'systems',
                'execution.json'
                )
        ) as _file:
            self.execution_sys = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'systems',
                'storage.json'
                )
        ) as _file:
            self.storage_sys = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'file.json'
                )
        ) as _file:
            self.agave_file = json.load(_file)

    def test_base_agave_file_serializer(self):
        """Test BaseAgaveFileSerializer."""
        afl = BaseFile(client=self.magave, **self.agave_file)
        serial_afl = json.dumps(
            afl,
            cls=BaseAgaveFileSerializer
        )
        _afl = BaseFile(client=self.magave, **json.loads(serial_afl))
        self.assertEqual(
            self.agave_file['name'],
            _afl.name
        )
        self.assertEqual(
            self.agave_file['path'],
            _afl.path
        )
        self.assertEqual(
            self.agave_file['system'],
            _afl.system
        )

    def test_storage_sys_serializer(self):
        """Test :class:`BaseAgaveSystemSerializer`"""
        sys = StorageSystem.from_dict(
            self.magave,
            self.storage_sys
        )
        serial_sys = json.dumps(
            sys,
            cls=BaseAgaveSystemSerializer
        )
        _sys = StorageSystem.from_dict(
            self.magave,
            json.loads(serial_sys)
        )
        self.assertEqual(
            self.storage_sys['id'],
            _sys.id
        )
        self.assertEqual(
            self.storage_sys['type'],
            _sys.type
        )
        self.assertEqual(
            self.storage_sys['uuid'],
            _sys.uuid
        )
        self.assertEqual(
            self.storage_sys['storage']['host'],
            _sys.storage.host
        )
        self.assertEqual(
            self.storage_sys['storage']['rootDir'],
            _sys.storage.root_dir
        )
        self.assertEqual(
            self.storage_sys['storage']['homeDir'],
            _sys.storage.home_dir
        )

    def test_execution_sys_serializer(self):
        """Test :class:`BaseAgaveSystemSerializer`"""
        sys = ExecutionSystem.from_dict(
            self.magave,
            self.execution_sys
        )
        serial_sys = json.dumps(
            sys,
            cls=BaseAgaveSystemSerializer
        )
        _sys = ExecutionSystem.from_dict(
            self.magave,
            json.loads(serial_sys)
        )
        self.assertEqual(
            self.execution_sys['id'],
            _sys.id
        )
        self.assertEqual(
            self.execution_sys['type'],
            _sys.type
        )
        self.assertEqual(
            self.execution_sys['uuid'],
            _sys.uuid
        )
        self.assertEqual(
            self.execution_sys['storage']['host'],
            _sys.storage.host
        )
        self.assertEqual(
            self.execution_sys['storage']['rootDir'],
            _sys.storage.root_dir
        )
        self.assertEqual(
            self.execution_sys['storage']['homeDir'],
            _sys.storage.home_dir
        )
        self.assertEqual(
            self.execution_sys['workDir'],
            _sys.work_dir
        )
        self.assertEqual(
            self.execution_sys['scratchDir'],
            _sys.scratch_dir
        )
        self.assertEqual(
            len(self.execution_sys['queues']),
            len(_sys.queues.queues)
        )


class TestAgaveUtils(TestCase):
    """Test Agave Serializers"""

    @classmethod
    def setUpClass(cls):
        super(TestAgaveUtils, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.AgaveOAuthToken.client',
            autospect=True
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

    def test_to_camel_case(self):
        """Test `to_camel_case` util."""
        attr = 'some_attribute'
        res = AgaveUtils.to_camel_case(attr)
        self.assertEqual(res, 'someAttribute')

    def test_walk(self):
        """Test `walk` util function."""
        self.magave.reset_mock()
        agave_dir = [obj for obj in self.agave_listing
                     if obj['type'] == 'dir' and obj['name'] != '.'][0]
        sub_root = copy.deepcopy(agave_dir)
        sub_root['name'] = '.'
        self.magave.files.list.side_effect = [
            self.agave_listing,
            [sub_root, self.agave_file]
        ]
        paths_visited = []
        for child in AgaveUtils.walk(
                self.magave,
                self.agave_listing[0]['system'],
                os.path.basename(self.agave_listing[0]['path'])
        ):
            paths_visited.append(child.path)

        self.assertEqual(
            self.magave.files.list.call_args_list,
            [call(
                systemId=self.agave_listing[0]['system'],
                filePath=os.path.basename(self.agave_listing[0]['path'])),
             call(
                 systemId=agave_dir['system'],
                 filePath=agave_dir['path'])]
        )
        flat_listing = self.agave_listing + [self.agave_file]

        for index, path in enumerate(paths_visited):
            self.assertEqual(
                path,
                flat_listing[index]['path']
            )

    def test_walk_levels(self):
        """Test `walk_levels` util."""
        self.magave.reset_mock()
        agave_dir = [obj for obj in self.agave_listing
                     if obj['type'] == 'dir' and obj['name'] != '.'][0]
        sub_root = copy.deepcopy(agave_dir)
        sub_root['name'] = '.'
        listings = [
            self.agave_listing,
            [sub_root, self.agave_file],
        ]
        listings_check = [
            self.agave_listing,
            [sub_root, self.agave_file],
        ]
        self.magave.files.list.side_effect = listings

        levels_visited = []

        for root, folders, files in AgaveUtils.walk_levels(
                self.magave,
                self.agave_listing[0]['system'],
                self.agave_listing[0]['path']
        ):
            levels_visited.append((root, folders, files))

        self.assertEqual(
            self.magave.files.list.call_args_list,
            [call(
                systemId=self.agave_listing[0]['system'],
                filePath=self.agave_listing[0]['path'],
                offset=0,
                limit=100),
             call(
                 systemId=agave_dir['system'],
                 filePath=agave_dir['path'],
                 offset=0,
                 limit=100)
             ]
        )

        for index, level in enumerate(levels_visited):
            listing = listings_check[index]
            root = listing[0]['path']
            folders = [f['path'] for f in listing
                       if f['format'] == 'folder' and
                       f['name'] != '.']
            files = [f['path'] for f in listing
                     if f['format'] != 'folder']
            self.assertEqual(
                root,
                level[0]
            )
            self.assertEqual(
                folders,
                [f['path'] for f in level[1]]
            )
            self.assertEqual(
                files,
                [f['path'] for f in level[2]]
            )
