"""
.. :module:: portal.libs.agave.models.unit_test
   :synopsis: Unit tests for Agave model representation.
"""
import logging
import os
import json
import copy
from mock import patch, call, Mock
from requests.exceptions import HTTPError
from django.test import TestCase
from django.conf import settings
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.models.systems.execution import ExecutionSystem

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class TestAgaveSystems(TestCase):
    """Test Agave File"""

    @classmethod
    def setUpClass(cls):
        super(TestAgaveSystems, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.TapisOAuthToken.client',
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
                'storage.json'
                )
        ) as _file:
            self.agave_storage = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'systems',
                'execution.json'
                )
        ) as _file:
            self.agave_execution = json.load(_file)

    def test_storage_system(self):
        """Test Storage System initialization"""
        self.magave.reset_mock()
        self.magave.systems.get.reset_mock()
        self.magave.systems.get = Mock(return_value=self.agave_storage)
        storage = StorageSystem(self.magave, id=self.agave_storage['id'])
        self.assertEqual(
            storage.uuid,
            self.agave_storage['uuid']
        )
        self.assertEqual(
            storage.id,
            self.agave_storage['id']
        )
        self.assertEqual(
            storage.name,
            self.agave_storage['name']
        )

    def test_execution_system(self):
        """Test Storage System initialization"""
        self.magave.reset_mock()
        self.magave.systems.get.reset_mock()
        self.magave.systems.get = Mock(return_value=self.agave_execution)
        execution = ExecutionSystem(self.magave, id=self.agave_execution['id'])
        self.assertEqual(
            execution.uuid,
            self.agave_execution['uuid']
        )
        self.assertEqual(
            execution.id,
            self.agave_execution['id']
        )
        self.assertEqual(
            execution.name,
            self.agave_execution['name']
        )

    def test_storage_create(self):
        """Test storage system creation"""
        self.magave.reset_mock()
        sys_dict = copy.deepcopy(self.agave_storage)
        sys_dict.pop('_links', None)
        uuid = sys_dict.pop('uuid', None)
        sys_dict['id'] = 'test.system.id'

        mock_response = Mock(status_code=404)
        self.magave.systems.get.side_effect = [
            HTTPError(response=mock_response),
            HTTPError(response=mock_response),
        ]
        self.magave.systems.add = Mock(return_value=sys_dict)

        sys = StorageSystem(
            self.magave,
            sys_dict['id'],
            description=sys_dict['description'],
            site=sys_dict['site'],
            name=sys_dict['name'],
        )

        sys_dict['uuid'] = uuid
        sys_dict['storage']['auth'] = {
            'username': sys_dict['owner'],
            'publicKey': 'pub_key',
            'privateKey': 'priv_key',
            'type': StorageSystem.AUTH_TYPES.SSHKEYS
        }

        sys.storage.protocol = StorageSystem.STORAGE_PROTOCOLS.SFTP
        sys.storage.port = 22
        sys.storage.host = sys_dict['storage']['host']
        sys.storage.root_dir = sys_dict['storage']['rootDir']
        sys.storage.home_dir = sys_dict['storage']['homeDir']

        sys.storage.auth.username = sys_dict['owner']
        sys.storage.auth.type = StorageSystem.AUTH_TYPES.SSHKEYS
        sys.storage.auth.public_key = 'pub_key'
        sys.storage.auth.private_key = 'priv_key'
        sys.validate()
        sys.save()

        self.magave.systems.get.assert_has_calls([
            call(systemId=sys_dict['id']),
            call(systemId=sys_dict['id'])
        ])

        self.assertEqual(
            sys_dict['uuid'],
            sys.uuid
        )
        self.assertEqual(
            sys_dict['name'],
            sys.name
        )
        self.assertEqual(
            sys_dict['description'],
            sys.description
        )
        self.assertEqual(
            sys_dict['id'],
            sys.id
        )
        self.assertEqual(
            sys_dict['storage']['host'],
            sys.storage.host
        )
        self.assertEqual(
            sys_dict['storage']['rootDir'],
            sys.storage.root_dir
        )
        self.assertEqual(
            sys_dict['storage']['homeDir'],
            sys.storage.home_dir
        )
        self.assertEqual(
            sys_dict['storage']['auth']['username'],
            sys.storage.auth.username
        )
        self.assertEqual(
            sys_dict['storage']['auth']['type'],
            sys.storage.auth.type
        )
        self.assertEqual(
            sys_dict['storage']['auth']['publicKey'],
            sys.storage.auth.public_key
        )
        self.assertEqual(
            sys_dict['storage']['auth']['privateKey'],
            sys.storage.auth.private_key
        )
