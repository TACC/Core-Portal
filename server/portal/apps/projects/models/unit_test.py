"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""
from django.test import TestCase
from django.conf import settings
from django.contrib.auth import get_user_model
from mock import patch, Mock, call
from portal.apps.projects.models.metadata import ProjectMetadata

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