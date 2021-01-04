"""Test.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""
from __future__ import unicode_literals, absolute_import
import logging
import os
from django.conf import settings
from portal.apps.projects.managers.base import ProjectsManager
import pytest

LOGGER = logging.getLogger(__name__)


@pytest.fixture()
def agave_client(mocker):
    yield mocker.patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)


@pytest.fixture()
def service_account(mocker):
    yield mocker.patch('portal.apps.projects.managers.base.service_account')


@pytest.fixture()
def project_manager(mocker, mock_owner):
    mocker.patch('portal.apps.projects.managers.base.ProjectsManager.get_project')
    project = ProjectsManager(mock_owner)
    project.get_project().project_id = "PRJ-123"
    project.get_project().storage.storage.root_dir = os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123")
    return project


@pytest.fixture()
def mock_project_indexer(mocker):
    yield mocker.patch('portal.apps.projects.managers.base.project_indexer')


@pytest.fixture()
def mock_owner(django_user_model):
    return django_user_model.objects.create_user(username='username',
                                                 password='password')


def test_add_member_pi(mock_owner, project_manager, service_account, mock_project_indexer):
    """Test add a PI to a project."""
    project_manager.add_member('PRJ-123', 'pi', 'username')
    project_manager.get_project().add_member.assert_not_called()
    project_manager.get_project().add_co_pi.assert_not_called()
    project_manager.get_project().add_pi.assert_called_with(mock_owner)

    service_account().jobs.submit.assert_called_with(
        body={
            "name": "username-PRJ-123-acls",
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": "PRJ-123",
                "username": "username",
                "action": "add",
                "root_dir": os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123"),
            }
        }
    )
    mock_project_indexer.apply_async.assert_called_with(args=['PRJ-123'])


def test_add_member_co_pi(mock_owner, project_manager, service_account, mock_project_indexer):
    """Test add a PI to a project."""
    project_manager.add_member('PRJ-123', 'co_pi', 'username')
    project_manager.get_project().add_member.assert_not_called()
    project_manager.get_project().add_pi.assert_not_called()
    project_manager.get_project().add_co_pi.assert_called_with(mock_owner)

    service_account().jobs.submit.assert_called_with(
        body={
            "name": "username-PRJ-123-acls",
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": "PRJ-123",
                "username": "username",
                "action": "add",
                "root_dir": os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123"),
            }
        }
    )
    mock_project_indexer.apply_async.assert_called_with(args=['PRJ-123'])


def test_add_member(mock_owner, project_manager, service_account, mock_project_indexer):
    """Test add a PI to a project."""
    project_manager.add_member('PRJ-123', 'team_member', 'username')

    project_manager.get_project().add_co_pi.assert_not_called()
    project_manager.get_project().add_pi.assert_not_called()
    project_manager.get_project().add_member.assert_called_with(mock_owner)

    service_account().jobs.submit.assert_called_with(
        body={
            "name": "username-PRJ-123-acls",
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": "PRJ-123",
                "username": "username",
                "action": "add",
                "root_dir": os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123"),
            }
        }
    )
    mock_project_indexer.apply_async.assert_called_with(args=['PRJ-123'])


def test_remove_member_pi(mock_owner, project_manager, service_account, mock_project_indexer):
    """Test add a PI to a project."""
    project_manager.remove_member('PRJ-123', 'pi', 'username')
    project_manager.get_project().remove_member.assert_not_called()
    project_manager.get_project().remove_co_pi.assert_not_called()
    project_manager.get_project().remove_pi.assert_called_with(mock_owner)

    service_account().jobs.submit.assert_called_with(
        body={
            "name": "username-PRJ-123-acls",
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": "PRJ-123",
                "username": "username",
                "action": "remove",
                "root_dir": os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123"),
            }
        }
    )
    mock_project_indexer.apply_async.assert_called_with(args=['PRJ-123'])


def test_remove_member_co_pi(mock_owner, project_manager, service_account, mock_project_indexer):
    """Test add a PI to a project."""
    project_manager.remove_member('PRJ-123', 'co_pi', 'username')
    project_manager.get_project().remove_member.assert_not_called()
    project_manager.get_project().remove_pi.assert_not_called()
    project_manager.get_project().remove_co_pi.assert_called_with(mock_owner)

    service_account().jobs.submit.assert_called_with(
        body={
            "name": "username-PRJ-123-acls",
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": "PRJ-123",
                "username": "username",
                "action": "remove",
                "root_dir": os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123"),
            }
        }
    )
    mock_project_indexer.apply_async.assert_called_with(args=['PRJ-123'])


def test_remove_member(mock_owner, project_manager, service_account, mock_project_indexer):
    """Test add a PI to a project."""
    project_manager.remove_member('PRJ-123', 'team_member', 'username')

    project_manager.get_project().remove_co_pi.assert_not_called()
    project_manager.get_project().remove_pi.assert_not_called()
    project_manager.get_project().remove_member.assert_called_with(mock_owner)

    service_account().jobs.submit.assert_called_with(
        body={
            "name": "username-PRJ-123-acls",
            "appId": settings.PORTAL_PROJECTS_PEMS_APP_ID,
            "archive": False,
            "parameters": {
                "projectId": "PRJ-123",
                "username": "username",
                "action": "remove",
                "root_dir": os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123"),
            }
        }
    )
    mock_project_indexer.apply_async.assert_called_with(args=['PRJ-123'])
