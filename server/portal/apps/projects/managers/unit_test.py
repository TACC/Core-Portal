"""Test.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""
from __future__ import unicode_literals, absolute_import
import logging
import os
from django.conf import settings
from portal.apps.projects.managers.base import ProjectsManager
from portal.apps.projects.models.base import ProjectId
import pytest

LOGGER = logging.getLogger(__name__)


@pytest.fixture()
def agave_client(mocker):
    yield mocker.patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)


@pytest.fixture()
def mock_index(mocker):
    yield mocker.patch('portal.apps.projects.managers.base.IndexedProject')


@pytest.fixture()
def service_account(mocker):
    yield mocker.patch('portal.apps.projects.managers.base.service_account')


@pytest.fixture()
def project_manager(mocker, authenticated_user):
    mocker.patch('portal.apps.projects.managers.base.ProjectsManager.get_project')
    project = ProjectsManager(authenticated_user)
    project.get_project().project_id = "PRJ-123"
    project.get_project().storage.storage.root_dir = os.path.join(settings.PORTAL_PROJECTS_ROOT_DIR, "PRJ-123")
    return project


def test_search(mocker, authenticated_user, project_manager, mock_index):
    mock_listing = mocker.patch('portal.apps.projects.managers.base.ProjectsManager.list')
    mock_listing.return_value = []
    mock_index.search().query().execute().return_value = []
    project_manager.search('testquery')
    assert mock_listing.call_count == 1
    mock_index.search().query.assert_called_with('query_string',
                                                 query='testquery',
                                                 minimum_should_match="80%")


def test_add_member_pi(authenticated_user, project_manager, service_account):
    """Test add a PI to a project."""
    project_manager.add_member('PRJ-123', 'pi', 'username')
    project_manager.get_project().add_member.assert_not_called()
    project_manager.get_project().add_co_pi.assert_not_called()
    project_manager.get_project().add_pi.assert_called_with(authenticated_user)

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


def test_add_member_co_pi(authenticated_user, project_manager, service_account):
    """Test add a PI to a project."""
    project_manager.add_member('PRJ-123', 'co_pi', 'username')
    project_manager.get_project().add_member.assert_not_called()
    project_manager.get_project().add_pi.assert_not_called()
    project_manager.get_project().add_co_pi.assert_called_with(authenticated_user)

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


def test_add_member(authenticated_user, project_manager, service_account):
    """Test add a PI to a project."""
    project_manager.add_member('PRJ-123', 'team_member', 'username')

    project_manager.get_project().add_co_pi.assert_not_called()
    project_manager.get_project().add_pi.assert_not_called()
    project_manager.get_project().add_member.assert_called_with(authenticated_user)

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


def test_remove_member_pi(authenticated_user, project_manager, service_account):
    """Test add a PI to a project."""
    project_manager.remove_member('PRJ-123', 'pi', 'username')
    project_manager.get_project().remove_member.assert_not_called()
    project_manager.get_project().remove_co_pi.assert_not_called()
    project_manager.get_project().remove_pi.assert_called_with(authenticated_user)

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


def test_remove_member_co_pi(authenticated_user, project_manager, service_account):
    """Test add a PI to a project."""
    project_manager.remove_member('PRJ-123', 'co_pi', 'username')
    project_manager.get_project().remove_member.assert_not_called()
    project_manager.get_project().remove_pi.assert_not_called()
    project_manager.get_project().remove_co_pi.assert_called_with(authenticated_user)

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


def test_remove_member(authenticated_user, project_manager, service_account):
    """Test add a PI to a project."""
    project_manager.remove_member('PRJ-123', 'team_member', 'username')

    project_manager.get_project().remove_co_pi.assert_not_called()
    project_manager.get_project().remove_pi.assert_not_called()
    project_manager.get_project().remove_member.assert_called_with(authenticated_user)

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


def test_project_manager_create(mocker, authenticated_user, project_manager, portal_project, mock_project_save_signal):
    mock_get_latest_project_directory = mocker.patch('portal.apps.projects.managers.base.get_latest_project_directory')
    mock_get_latest_project_storage = mocker.patch('portal.apps.projects.managers.base.get_latest_project_storage')
    mock_get_latest_project_directory.return_value = 11
    mock_get_latest_project_storage.return_value = 12

    # Assert no ProjectId exists
    assert len(ProjectId.objects.all()) == 0

    # Project creation should initialize ProjectId
    project_manager.create('PRJ-1')
    assert len(ProjectId.objects.all()) == 1
    assert ProjectId.objects.all()[0].value == 13 # max of prj dir and storage values

    # ProjectId collision should resolve
    mock_get_latest_project_directory.return_value = 21
    mock_get_latest_project_storage.return_value = 20
    ProjectId.update(12)
    portal_project._create_storage.side_effect = ValueError()
    with pytest.raises(ValueError):
        project_manager.create('PRJ-13')
    assert ProjectId.objects.all()[0].value == 22  # max of prj dir and storage values
