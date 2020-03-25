"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""
from django.test import TestCase, TransactionTestCase
from django.conf import settings
from django.contrib.auth import get_user_model
from mock import patch, Mock, MagicMock, call
from portal.apps.projects.models.metadata import ProjectMetadata
from portal.apps.projects.models.base import Project

class TestProjectMetadataModel(TestCase):
    """Test Project Metadata Models."""

    fixtures = ['users']

    def test_create_metadata(self):
        project_id="PRJ-123"
        # Mock project creator/owner
        username = "username"
        mock_owner = get_user_model().objects.get(username=username)

        defaults = {
            'title' : "Project Title",
            'owner' : mock_owner
        }
        (meta, result) = ProjectMetadata.objects.get_or_create(
            project_id=project_id,
            defaults=defaults
        )
        self.assertIsNotNone(meta)
        self.assertEqual(meta.project_id, "PRJ-123")
        self.assertEqual(meta.title, "Project Title")
        self.assertEqual(meta.owner.username, "username")
        self.assertEqual(meta.co_pis.count(), 0)
        self.assertEqual(meta.team_members.count(), 0)

    def test_metadata_str(self):
        project_id="PRJ-123"
        defaults = {
            'title' : "Project Title"
        }
        meta = ProjectMetadata.objects.get_or_create(
            project_id=project_id,
            defaults=defaults
        )
        meta_str = str(meta)
        self.assertEqual(meta_str, "(<ProjectMetadata: PRJ-123 - Project Title>, True)")

class TestProjectCreationFailure(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super(TestProjectCreationFailure, cls).setUpClass()
        cls.mock_agave_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        cls.mock_agave_client = cls.mock_agave_patcher.start()
        cls.mock_user = MagicMock(spec=get_user_model())

    @classmethod
    def tearDownClass(cls):
        super(TestProjectCreationFailure, cls).setUpClass()
        cls.mock_agave_patcher.stop()

    def setUp(self):
        super(TestProjectCreationFailure, self).setUp()
        self.mock_create_dir_patcher = patch('portal.apps.projects.models.base.Project._create_dir')
        self.mock_create_dir = self.mock_create_dir_patcher.start()
        self.mock_delete_dir_patcher = patch('portal.apps.projects.models.base.Project._delete_dir')
        self.mock_delete_dir = self.mock_delete_dir_patcher.start()
        self.mock_create_storage_patcher = patch('portal.apps.projects.models.base.Project._create_storage')
        self.mock_create_storage = self.mock_create_storage_patcher.start()
        self.mock_create_metadata_patcher = patch('portal.apps.projects.models.base.Project._create_metadata')
        self.mock_create_metadata = self.mock_create_metadata_patcher.start()

    def tearDown(self):
        super(TestProjectCreationFailure, self).tearDown()
        self.mock_create_dir_patcher.stop()
        self.mock_delete_dir_patcher.stop()
        self.mock_create_storage_patcher.stop()
        self.mock_create_metadata_patcher.stop()

    def test_create_dir_failure(self):
        self.mock_create_dir.side_effect = Exception()
        with self.assertRaises(Exception):
            Project.create(self.mock_agave_client, "my_project", "mock_project_id", self.mock_user)
        self.assertEqual(ProjectMetadata.objects.count(), 0)    
    
    def test_create_storage_failure(self):
        self.mock_create_storage.side_effect = Exception()
        with self.assertRaises(Exception):
            Project.create(self.mock_agave_client, "my_project", "mock_project_id", self.mock_user)
        self.mock_delete_dir.assert_called_with("mock_project_id")
        self.assertEqual(ProjectMetadata.objects.count(), 0)        