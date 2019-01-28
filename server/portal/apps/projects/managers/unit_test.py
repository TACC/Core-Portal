"""Test.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.conf import settings
from django.test import TestCase
from django.contrib.auth import get_user_model
from mock import patch, Mock
from portal.apps.projects.managers.base import ProjectsManager


LOGGER = logging.getLogger(__name__)


class TestProjectsManager(TestCase):
    """Test Projects Models."""

    fixtures = ['users', 'auth', 'accounts']

    @classmethod
    def setUpClass(cls):
        """Set up Class."""
        super(TestProjectsManager, cls).setUpClass()
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
        user = get_user_model().objects.get(username='username')
        self.mgr = ProjectsManager(user)
        self.patch_get_project = patch(
            'portal.apps.projects.managers.base.ProjectsManager.get_project',
            return_value=Mock()
        )
        self.mock_get_project = self.patch_get_project.start()
        self.patch_service_account = patch(
            'portal.apps.projects.managers.base.service_account',
            return_value=Mock(autospec=True)
        )
        self.mock_service_account = self.patch_service_account.start()

    def tearDown(self):
        """Teardown."""
        self.patch_get_project.stop()
        self.patch_service_account.stop()

    def test_add_member_pi(self):
        """Test add a PI to a project."""
        self.mgr.add_member('PRJ-123', 'pi', 'username')
        self.mock_get_project().add_member.assert_not_called()
        self.mock_get_project().add_co_pi.assert_not_called()
        self.assertEqual(len(self.mock_get_project().add_pi.mock_calls), 1)
        self.mock_service_account().jobs.submit.called_with(
            body={
                "name": "username-PRJ-123-acls",
                "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
                "archive": False,
                "parameter": {
                    "projectId": "PRJ-123",
                    "username": "username",
                    "action": "add",
                    "root_dir": settings.PORTAL_PROJECTS_ROOT_DIR,
                }
            }
        )

    def test_add_member_co_pi(self):
        """Test add a Co PI to a project."""
        self.mgr.add_member('PRJ-123', 'co_pi', 'username')
        self.mock_get_project().add_member.assert_not_called()
        self.mock_get_project().add_pi.assert_not_called()
        self.assertEqual(len(self.mock_get_project().add_co_pi.mock_calls), 1)
        self.mock_service_account().jobs.submit.called_with(
            body={
                "name": "username-PRJ-123-acls",
                "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
                "archive": False,
                "parameter": {
                    "projectId": "PRJ-123",
                    "username": "username",
                    "action": "add",
                    "root_dir": settings.PORTAL_PROJECTS_ROOT_DIR,
                }
            }
        )

    def test_add_member(self):
        """Test add a member to a project."""
        self.mgr.add_member('PRJ-123', 'team_member', 'username')
        self.mock_get_project().add_co_pi.assert_not_called()
        self.mock_get_project().add_pi.assert_not_called()
        self.assertEqual(len(self.mock_get_project().add_member.mock_calls), 1)
        self.mock_service_account().jobs.submit.called_with(
            body={
                "name": "username-PRJ-123-acls",
                "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
                "archive": False,
                "parameter": {
                    "projectId": "PRJ-123",
                    "username": "username",
                    "action": "add",
                    "root_dir": settings.PORTAL_PROJECTS_ROOT_DIR,
                }
            }
        )

    def test_remove_member_pi(self):
        """Test add a PI to a project."""
        self.mgr.remove_member('PRJ-123', 'pi', 'username')
        self.mock_get_project().remove_member.assert_not_called()
        self.mock_get_project().remove_co_pi.assert_not_called()
        self.assertEqual(len(self.mock_get_project().remove_pi.mock_calls), 1)
        self.mock_service_account().jobs.submit.called_with(
            body={
                "name": "username-PRJ-123-acls",
                "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
                "archive": False,
                "parameter": {
                    "projectId": "PRJ-123",
                    "username": "username",
                    "action": "remove",
                    "root_dir": settings.PORTAL_PROJECTS_ROOT_DIR,
                }
            }
        )

    def test_remove_member_co_pi(self):
        """Test add a Co PI to a project."""
        self.mgr.remove_member('PRJ-123', 'co_pi', 'username')
        self.mock_get_project().remove_member.assert_not_called()
        self.mock_get_project().remove_pi.assert_not_called()
        self.assertEqual(len(self.mock_get_project().remove_co_pi.mock_calls), 1)
        self.mock_service_account().jobs.submit.called_with(
            body={
                "name": "username-PRJ-123-acls",
                "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
                "archive": False,
                "parameter": {
                    "projectId": "PRJ-123",
                    "username": "username",
                    "action": "remove",
                    "root_dir": settings.PORTAL_PROJECTS_ROOT_DIR,
                }
            }
        )

    def test_remove_member(self):
        """Test add a member to a project."""
        self.mgr.remove_member('PRJ-123', 'team_member', 'username')
        self.mock_get_project().remove_co_pi.assert_not_called()
        self.mock_get_project().remove_pi.assert_not_called()
        self.assertEqual(len(self.mock_get_project().remove_member.mock_calls), 1)
        self.mock_service_account().jobs.submit.called_with(
            body={
                "name": "username-PRJ-123-acls",
                "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
                "archive": False,
                "parameter": {
                    "projectId": "PRJ-123",
                    "username": "username",
                    "action": "remove",
                    "root_dir": settings.PORTAL_PROJECTS_ROOT_DIR,
                }
            }
        )
