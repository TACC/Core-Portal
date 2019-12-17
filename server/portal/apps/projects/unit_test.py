"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""
from __future__ import unicode_literals, absolute_import
import datetime
import logging
import json
import copy
import os
from requests.exceptions import HTTPError
from django.test import TestCase
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from mock import patch, Mock, call
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.projects.models.base import Project
from portal.apps.projects.models.metadata import ProjectMetadata
from portal.apps.projects.exceptions import NotAuthorizedError


LOGGER = logging.getLogger(__name__)


class TestProjectsModels(TestCase):
    """Test Projects Models."""

    fixtures = ['users', 'auth', 'accounts']

    @classmethod
    def setUpClass(cls):
        """Set up Class."""
        super(TestProjectsModels, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.AgaveOAuthToken.client',
            autospec=True
        )
        cls.magave = cls.magave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        """Tear Down Class."""
        cls.magave_patcher.stop()

    def setUp(self):
        """Setup."""
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
                'metadata',
                'metadata.json'
            )
        ) as _file:
            self.agave_meta = json.load(_file)

        with open(
            os.path.join(
                agave_path,
                'files',
                'directory.json'
            )
        ) as _file:
            self.agave_directory = json.load(_file)

    @patch('portal.apps.projects.models.base.Project.title')
    @patch('portal.apps.projects.models.base.Project._create_metadata')
    @patch('portal.apps.projects.models.base.ProjectMetadata')
    @patch('portal.apps.projects.models.base.StorageSystem')
    def test_project_init(
            self,
            mock_storage,
            mock_meta,
            mock_create_meta,
            mock_title
    ):
        """Test project model init."""
        self.magave.reset_mock()
        mock_meta.objects.get.side_effect = ObjectDoesNotExist()

        prj = Project(self.magave, 'PRJ-123')

        self.assertEquals('PRJ-123', prj.project_id)
        mock_storage.assert_called_with(
            self.magave,
            id='{prefix}.{project_id}'.format(
                prefix=Project.metadata_name,
                project_id='PRJ-123'
            )
        )
        mock_meta.objects.get.assert_called_with(project_id="PRJ-123")
        mock_create_meta.assert_called_with(mock_title, 'PRJ-123')

    @patch('portal.apps.projects.models.base.ProjectMetadata')
    @patch('portal.apps.projects.utils.BaseFile')
    @patch('portal.apps.projects.utils.service_account')
    @patch('portal.apps.projects.models.base.service_account')
    def test_project_create(
            self,
            mock_sa,
            mock_sac,
            base_file,
            meta_model
    ):
        """Test project create."""
        self.magave.reset_mock()
        mock_sa.return_value = self.magave
        mock_sac.return_value = self.magave
        # Mock folder creation
        base_file.return_value = BaseFile(
            self.magave,
            system=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
            PATH='/'
        )
        _dir = copy.deepcopy(self.agave_directory)
        _dir['path'] = '/PRJ-123'
        _dir['systemId'] = settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME
        _dir['name'] = 'PRJ-123'
        self.magave.files.manage = Mock(return_value=_dir)
        # Mock system initialization
        mock_response = Mock(status_code=404)
        self.magave.systems.get.side_effect = [
            HTTPError(response=mock_response),
            HTTPError(response=mock_response),
        ]
        self.magave.systems.add = Mock(
            return_value={
                'uuid': 'prj-uuid',
                'lastModified': datetime.datetime.utcnow().isoformat(),
            }
        )

        # Mock project creator/owner
        username = 'username'
        mock_owner = get_user_model().objects.get(username=username)

        ###############
        prj = Project.create(self.magave, 'Project Title', 'PRJ-123', mock_owner)
        ###############

        # Assert file creation
        base_file.assert_called_with(
            self.magave,
            system=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
            path='/'
        )
        self.magave.files.manage.assert_called_with(
            systemId=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
            filePath='/',
            body={
                'action': 'mkdir',
                'path': 'PRJ-123'
            }
        )

        # Assert system creation
        self.assertEqual(
            prj.storage.id,
            '{prefix}.{project_id}'.format(
                prefix=Project.metadata_name,
                project_id='PRJ-123'
            )
        )
        self.assertEqual(
            prj.storage.name,
            'PRJ-123'
        )
        self.assertEqual(
            prj.storage.description,
            'Project Title'
        )
        self.assertEqual(
            prj.storage.storage.root_dir,
            os.path.join(
                settings.PORTAL_PROJECTS_ROOT_DIR,
                'PRJ-123'
            )
        )
        self.assertEqual(
            prj.storage.storage.host,
            settings.PORTAL_PROJECTS_ROOT_HOST
        )
        self.assertEqual(
            prj.storage.storage.auth.username,
            settings.PORTAL_ADMIN_USERNAME
        )
        self.assertEqual(
            prj.storage.storage.auth.type,
            prj.storage.AUTH_TYPES.SSHKEYS
        )
        self.assertTrue(
            prj.storage.storage.auth.public_key.startswith(
                'ssh-rsa'
            )
        )
        self.assertTrue(
            prj.storage.storage.auth.private_key.startswith(
                '-----BEGIN RSA PRIVATE KEY-----'
            )
        )
        meta_model.objects.get_or_create.assert_called_with(
            project_id="PRJ-123",
            defaults={
                'owner': mock_owner,
                'title': 'Project Title'
            }
        )

    @patch('portal.apps.projects.models.base.ProjectMetadata')
    @patch('portal.apps.projects.models.base.StorageSystem',
           autospec=True)
    def test_listing(self, mock_storage_sys, mock_prj_meta):
        """Test projects listing."""
        self.magave.reset_mock()
        sys_one = Mock(spec=StorageSystem(self.magave))
        sys_one.name.return_value = 'PRJ-123'
        sys_two = Mock(spec=StorageSystem(self.magave))
        sys_two.name.return_value = 'PRJ-124'
        mock_storage_sys.search.return_value = [
            sys_one,
            sys_two,
        ]
        mock_prj_meta.objects.get.side_effect = [
            Mock(spec=ProjectMetadata(self.magave)),
            Mock(spec=ProjectMetadata(self.magave)),
        ]

        lst = list(Project.listing(self.magave))

        mock_storage_sys.search.assert_called_with(
            self.magave,
            query={'id.like': '{}*'.format(Project.metadata_name),
                   'type.eq': mock_storage_sys.TYPES.STORAGE},
            offset=0,
            limit=100
        )
        mock_prj_meta.objects.get.assert_has_calls([
            call(project_id=sys_one.name),
            call(project_id=sys_two.name)
        ])
        self.assertEquals(len(lst), 2)

    @patch('portal.apps.projects.models.base.Project.save_metadata')
    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_add_member(self, can_edit_member, save_metadata):
        """Test add member."""
        self.magave.reset_mock()
        can_edit_member.return_value = True
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        prj.add_member(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        mock_storage.roles.add.assert_called_with(username, 'USER')
        self.assertEqual(mock_storage.roles.save.call_count, 1)
        mock_meta.team_members.add.assert_called_with(user)
        self.assertEqual(save_metadata.call_count, 1)


    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_add_member_unauthorized(self, can_edit_member):
        """Test add member unauthorized."""
        self.magave.reset_mock()
        can_edit_member.return_value = False
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        with self.assertRaises(NotAuthorizedError) as exc:
            prj.add_member(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        self.assertEqual(exc.exception.extra['user'].username, username)
        self.assertIsNot(exc.exception.message, None)
        self.assertNotEqual(exc.exception.response.status_code, 200)

    @patch('portal.apps.projects.models.base.Project.save_metadata')
    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_remove_member(self, can_edit_member, save_metadata):
        """Test remove member."""
        self.magave.reset_mock()
        can_edit_member.return_value = True
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        prj.remove_member(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        mock_storage.roles.delete_for_user.assert_called_with(username)
        self.assertEqual(mock_storage.roles.save.call_count, 1)
        mock_meta.team_members.remove.called_once_with(user)
        self.assertEqual(save_metadata.call_count, 1)

    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_remove_member_unauthorized(self, can_edit_member):
        """Test remove member unauthorized."""
        self.magave.reset_mock()
        can_edit_member.return_value = False
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        with self.assertRaises(NotAuthorizedError) as exc:
            prj.remove_member(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        self.assertEqual(exc.exception.extra['user'].username, username)
        self.assertIsNot(exc.exception.message, None)
        self.assertNotEqual(exc.exception.response.status_code, 200)

    @patch('portal.apps.projects.models.base.Project.save_metadata')
    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_add_co_pi(self, can_edit_member, save_metadata):
        """Test add co pi."""
        self.magave.reset_mock()
        can_edit_member.return_value = True
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        prj.add_co_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        mock_storage.roles.add.assert_called_with(username, 'ADMIN')
        self.assertEqual(mock_storage.roles.save.call_count, 1)
        mock_meta.co_pis.add.assert_called_with(user)
        self.assertEqual(save_metadata.call_count, 1)


    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_add_co_pi_unauthorized(self, can_edit_member):
        """Test add co pi unauthorized."""
        self.magave.reset_mock()
        can_edit_member.return_value = False
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        with self.assertRaises(NotAuthorizedError) as exc:
            prj.add_co_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        self.assertEqual(exc.exception.extra['user'].username, username)
        self.assertIsNot(exc.exception.message, None)
        self.assertNotEqual(exc.exception.response.status_code, 200)

    @patch('portal.apps.projects.models.base.Project.save_metadata')
    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_remove_co_pi(self, can_edit_member, save_metadata):
        """Test remove co pi."""
        self.magave.reset_mock()
        can_edit_member.return_value = True
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        prj.remove_co_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        mock_storage.roles.delete_for_user.assert_called_with(username)
        self.assertEqual(mock_storage.roles.save.call_count, 1)
        mock_meta.co_pis.remove.called_once_with(user)
        self.assertEqual(save_metadata.call_count, 1)

    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_remove_co_pi_unauthorized(self, can_edit_member):
        """Test remove co pi unauthorized."""
        self.magave.reset_mock()
        can_edit_member.return_value = False
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        with self.assertRaises(NotAuthorizedError) as exc:
            prj.remove_co_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        self.assertEqual(exc.exception.extra['user'].username, username)
        self.assertIsNot(exc.exception.message, None)
        self.assertNotEqual(exc.exception.response.status_code, 200)

    @patch('portal.apps.projects.models.base.Project.save_metadata')
    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_add_pi(self, can_edit_member, save_metadata):
        """Test add pi."""
        self.magave.reset_mock()
        can_edit_member.return_value = True
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        prj.add_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        mock_storage.roles.add.assert_called_with(username, 'OWNER')
        self.assertEqual(mock_storage.roles.save.call_count, 1)
        self.assertEqual(mock_meta.pi, user)
        self.assertEqual(save_metadata.call_count, 1)

    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_add_pi_unauthorized(self, can_edit_member):
        """Test add pi unauthorized."""
        self.magave.reset_mock()
        can_edit_member.return_value = False
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        with self.assertRaises(NotAuthorizedError) as exc:
            prj.add_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        self.assertEqual(exc.exception.extra['user'].username, username)
        self.assertIsNot(exc.exception.message, None)
        self.assertNotEqual(exc.exception.response.status_code, 200)

    @patch('portal.apps.projects.models.base.Project.save_metadata')
    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_remove_pi(self, can_edit_member, save_metadata):
        """Test remove pi."""
        self.magave.reset_mock()
        can_edit_member.return_value = True
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        prj.remove_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        mock_storage.roles.delete_for_user.assert_called_with(username)
        self.assertEqual(mock_storage.roles.save.call_count, 1)
        self.assertIs(mock_meta.pi, None)
        self.assertEqual(save_metadata.call_count, 1)

    @patch('portal.apps.projects.models.base.Project._can_edit_member')
    def test_remove_pi_unauthorized(self, can_edit_member):
        """Test remove pi unauthorized."""
        self.magave.reset_mock()
        can_edit_member.return_value = False
        mock_storage = Mock(spec=StorageSystem(self.magave))
        mock_meta = Mock(spec=ProjectMetadata())
        username = 'username'
        user = get_user_model().objects.get(username=username)

        prj = Project(self.magave, "PRJ-123", mock_meta, mock_storage)
        with self.assertRaises(NotAuthorizedError) as exc:
            prj.remove_pi(user)

        can_edit_member.assert_called_with(self.magave.token.token_username)
        self.assertEqual(exc.exception.extra['user'].username, username)
        self.assertIsNot(exc.exception.message, None)
        self.assertNotEqual(exc.exception.response.status_code, 200)

    @patch('portal.apps.projects.models.base.ProjectMetadata')
    def test_create_metadata(self, meta_model):
        # Test creating metadata with no owner
        Project._create_metadata("Project Title", "PRJ-123")
        meta_model.objects.get_or_create.assert_called_with(
            project_id="PRJ-123",
            defaults={
                'title': 'Project Title'
            }
        ) 

        # Test creating metadata with mock project creator/owner
        username = 'username'
        mock_owner = get_user_model().objects.get(username=username)
        Project._create_metadata("Project Title", "PRJ-123", mock_owner)
        meta_model.objects.get_or_create.assert_called_with(
            project_id="PRJ-123",
            defaults={
                'title': 'Project Title',
                'owner': mock_owner
            }
        ) 
