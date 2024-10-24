"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""

import logging
from unittest.mock import MagicMock, patch

import pytest  # pyright: ignore
from django.conf import settings  # pyright: ignore

from portal.apps.projects.exceptions import NotAuthorizedError
# from portal.apps.projects.models.base import Project
from portal.apps.projects.models.metadata import ProjectMetadata
from portal.apps.projects.workspace_operations import \
    shared_workspace_operations as ws_o

LOGGER = logging.getLogger(__name__)

pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_service_account(mocker):
    yield mocker.patch(
        "portal.apps.projects.models.base.service_account", autospec=True
    )


# @pytest.fixture()
# def mock_signal(mocker):
#     yield mocker.patch("portal.apps.signals.receivers.index_project")


@pytest.fixture()
def mock_owner(django_user_model):
   return "owner" 


# Mock creation of a project

# Minimal mocks, only do behavior based testing instead of implementation based testing

@pytest.fixture()
def mock_tapis_client():
    with patch(
        "tapipy.tapis.Tapis"
        ) as mock_client:
        
        mock_listing = []
        class DictObj:
            def __init__(self, **entries):
                # Recursive conversion of nested dictionaries into object for attribute reference
                # This is needed because of the behavior of shared_workspace_operations.py and its usage of objects from JSON
                for key, value in entries.items():
                    if isinstance(value, dict):
                        self.__dict__[key] = DictObj(**value)
                    else:
                        self.__dict__[key] = value
        # Mock createSystem with the side effect
        def create_system_side_effect(**system_args):
            system_created = "2024-10-18T00:00:00Z"
            system_args['created'] = system_created
            system_obj = DictObj(**system_args)
            title = getattr(system_obj.notes, "title", None)
            mock_listing.append(system_obj)
        def get_system_side_effect(systemId):
            # TODO: Change for multiple systems, tests only one system for now 
            return mock_listing[0]

        mock_client.systems.createSystem = MagicMock(side_effect=create_system_side_effect)
        mock_client.systems.getShareInfo = MagicMock()
        mock_client.systems.getSystem = MagicMock(side_effect=get_system_side_effect)
        mock_client.files.getPermissions = MagicMock()
        # TODO: Enable this for the list systems test
        #mock_client.systems.getSystems = MagicMock(return_value=mock_listing)
        mock_client.systems.getSystems = MagicMock()
        
        yield mock_client



def test_project_init(mock_tapis_client, mock_owner):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,),patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.get_project_user") as mock_get_project_user, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.get_project",wraps=ws_o.get_project):
        "Test project model init."
        # Assert Defs
        result_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.PRJ-123"
        result_title = "My New Workspace"
        result_description = "This is a test description"
        result_created = "2024-10-18T00:00:00Z"
        mock_get_project_user.return_value = {"username": "mock_user"}

        # Mock Tapis Client
        client = mock_tapis_client 
        # Create the shared workspace
        project_id = ws_o.create_workspace_system(
            client,
            workspace_id="PRJ-123",
            title=result_title,
            description=result_description,
            owner=mock_owner,
        )
        ws_o.create_workspace_system.assert_called_once_with(
            client,
            workspace_id="PRJ-123",
            title=result_title,
            description=result_description,
            owner=mock_owner,
        )

        # Assert the results
        assert project_id == result_system_id
        project = ws_o.get_project(client, workspace_id="PRJ-123")
        assert project["title"] == result_title
        assert project["description"] == result_description
        assert project["created"] == result_created
        assert project["projectId"] == "PRJ-123" 
        assert len(project["members"]) == 1
        assert project["members"][0]["user"]["username"] == "mock_user"
        assert project["members"][0]["access"] == "owner"

@pytest.mark.skip(reason="Needs to be updated with new Mocked Tapis Storage")
def test_project_create(setup_mocks, mock_owner):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account",
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count",
        wraps=ws_o.increment_workspace_count,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_shared_workspace",
        wraps=ws_o.create_shared_workspace,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir",
        wraps=ws_o.create_workspace_dir,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls",
        wraps=ws_o.set_workspace_acls,
    ):

        "Test add member."
        "Mocking add_user_to_workspace"

        # Mock Tapis Initial
        client = setup_mocks
        # Create Test project to test workspace operation
        system_id = ws_o.create_shared_workspace(client, "PRJ-123", mock_owner)
        result_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.test.project-2"
        assert system_id == result_system_id
        ws_o.service_account.assert_called()
        ws_o.increment_workspace_count.assert_called()
        ws_o.create_workspace_dir.assert_called_once_with(
            f"{settings.PORTAL_PROJECTS_ID_PREFIX}-2"
        )
        ws_o.set_workspace_acls.assert_called()
        ws_o.create_workspace_system.assert_called()


@pytest.mark.skip(reason="Needs to be updated with new Mocked Tapis Storage")
def test_listing(setup_mocks, mock_owner):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account",
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count",
        wraps=ws_o.increment_workspace_count,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_shared_workspace",
        wraps=ws_o.create_shared_workspace,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir",
        wraps=ws_o.create_workspace_dir,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.list_projects",
        wraps=ws_o.list_projects,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls",
        wraps=ws_o.set_workspace_acls,
    ):

        # Mock Tapis Initial
        client = setup_mocks

        # Create two projects/workspaces
        project_id_1 = ws_o.create_shared_workspace(client, "PRJ-123", mock_owner)
        project_id_2 = ws_o.create_shared_workspace(client, "PRJ-124", mock_owner)
        # Assert that the mocks were called
        ws_o.service_account.assert_called()
        ws_o.increment_workspace_count.assert_called()
        ws_o.create_workspace_dir.assert_any_call(
            f"{settings.PORTAL_PROJECTS_ID_PREFIX}-2"
        )
        assert ws_o.create_workspace_dir.call_count == 2
        ws_o.set_workspace_acls.assert_called()
        ws_o.create_workspace_system.assert_called()

        # TODO: Replace with the actual list_projects return value
        # Mock the return value of list_projects
        # ws_o.list_projects.return_value = [
        #     {"project_id": project_id_1, "title": "Project 123"},
        #     {"project_id": project_id_2, "title": "Project 124"},
        # ]

        # Call the function to list projects
        projects = ws_o.list_projects(client)

        ws_o.list_projects.assert_called_once_with(client)

        # Verify the returned projects
        assert len(projects) == 2
        assert projects[0]["project_id"] == project_id_1
        assert projects[0]["title"] == "Project 123"
        assert projects[1]["project_id"] == project_id_2
        assert projects[1]["title"] == "Project 124"


@pytest.mark.skip(reason="Needs to be updated with new Mocked Tapis Storage")
def test_add_member(setup_mocks, mock_owner, django_user_model):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account"
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count",
        wraps=ws_o.increment_workspace_count,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_shared_workspace",
        wraps=ws_o.create_shared_workspace,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir",
        wraps=ws_o.create_workspace_dir,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls",
        wraps=ws_o.set_workspace_acls,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.add_user_to_workspace",
        wraps=ws_o.add_user_to_workspace,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_permissions",
        wraps=ws_o.set_workspace_permissions,
    ):

        "Test add member."
        "Mocking add_user_to_workspace"

        # Mock Tapis Initial
        client = setup_mocks
        # Create Test project to test workspace operation
        system_id = ws_o.create_shared_workspace(client, "PRJ-123", mock_owner)
        result_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.test.project-2"
        assert system_id == result_system_id
        ws_o.service_account.assert_called()
        ws_o.increment_workspace_count.assert_called()
        ws_o.create_workspace_dir.assert_called_once_with("test.project-2")
        ws_o.set_workspace_acls.assert_called()
        ws_o.create_workspace_system.assert_called()

        # Start test of add user
        # Assert that the mocks were called
        project = ws_o.add_user_to_workspace(
            client, system_id, "teamMember", role="writer"
        )
        ws_o.service_account.assert_called()
        ws_o.set_workspace_acls.assert_called()
        # TODO: Fix why this is a test within a test project
        client.systems.shareSystem.assert_called_once_with(
            systemId="test.project.test.project.test.project-2", users=["teamMember"]
        )
        ws_o.set_workspace_permissions.assert_called_once_with(
            client, "teamMember", "test.project." + system_id, "writer"
        )
        mock_users = [
            {
                "user": {
                    "username": "owner",
                    "email": "",
                    "first_name": "",
                    "last_name": "",
                },
                "access": "owner",
            },
            {
                "user": {
                    "username": "user",
                    "email": "",
                    "first_name": "",
                    "last_name": "",
                },
                "access": "edit",
            },
        ]
        expected_project = {
            "title": "My New Workspace",
            "description": "This is a test description",
            "created": "2024-10-18T00:00:00Z",
            "projectId": system_id,
            "members": mock_users,
        }
        assert project == expected_project


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_add_member_unauthorized(
    mock_owner,
    django_user_model,
    mock_tapis_client,
    mock_storage_system,
    project_model,
    mock_signal,
    mock_service_account,
):
    "Test add member."

    prj = project_model.create(mock_tapis_client, "Test Title", "PRJ-123", mock_owner)
    prj.storage.roles.for_user.return_value = MagicMock(role="USER", ADMIN="ADMIN")
    assert not prj._can_edit_member(mock_owner)

    mock_team_member = django_user_model.objects.create_user(
        username="teamMember", password="password"
    )

    with pytest.raises(NotAuthorizedError):
        prj.add_member(mock_team_member)

    assert prj.storage.roles.add.call_count == 0
    assert prj.storage.roles.save.call_count == 0
    assert prj.metadata.team_members.all().count() == 0


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_add_copi(
    mock_owner,
    django_user_model,
    mock_tapis_client,
    mock_storage_system,
    project_model,
    mock_signal,
    mock_service_account,
):

    prj = project_model.create(mock_tapis_client, "Test Title", "PRJ-123", mock_owner)
    prj.storage.roles.for_user.return_value = MagicMock(role="ADMIN", ADMIN="ADMIN")
    assert prj._can_edit_member(mock_owner)

    mock_copi = django_user_model.objects.create_user(
        username="coPi", password="password"
    )
    prj.add_co_pi(mock_copi)

    prj.storage.roles.add.assert_called_with("coPi", "ADMIN")
    assert prj.storage.roles.save.call_count == 1
    assert prj.metadata.co_pis.get(username="coPi")

    prj.remove_co_pi(mock_copi)
    with pytest.raises(django_user_model.DoesNotExist):
        prj.metadata.team_members.get(username="teamMember")


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_add_copi_unauthorized(
    mock_owner,
    django_user_model,
    mock_tapis_client,
    mock_storage_system,
    project_model,
    mock_signal,
    mock_service_account,
):
    "Test add member."

    prj = project_model.create(mock_tapis_client, "Test Title", "PRJ-123", mock_owner)
    prj.storage.roles.for_user.return_value = MagicMock(role="USER", ADMIN="ADMIN")
    assert not prj._can_edit_member(mock_owner)

    mock_copi = django_user_model.objects.create_user(
        username="coPi", password="password"
    )

    with pytest.raises(NotAuthorizedError):
        prj.add_co_pi(mock_copi)

    assert prj.storage.roles.add.call_count == 0
    assert prj.storage.roles.save.call_count == 0
    assert prj.metadata.co_pis.all().count() == 0


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_add_pi(
    mock_owner,
    django_user_model,
    mock_tapis_client,
    mock_storage_system,
    project_model,
    mock_signal,
    mock_service_account,
):

    prj = project_model.create(mock_tapis_client, "Test Title", "PRJ-123", mock_owner)
    prj.storage.roles.for_user.return_value = MagicMock(role="ADMIN", ADMIN="ADMIN")
    assert prj._can_edit_member(mock_owner)

    mock_pi = django_user_model.objects.create_user(username="pi", password="password")
    prj.add_pi(mock_pi)

    prj.storage.roles.add.assert_called_with("pi", "OWNER")
    assert prj.storage.roles.save.call_count == 1
    assert prj.metadata.pi.username == "pi"

    prj.remove_pi(mock_pi)
    assert not prj.metadata.pi


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_add_pi_unauthorized(
    mock_owner,
    django_user_model,
    mock_tapis_client,
    mock_storage_system,
    project_model,
    mock_signal,
    mock_service_account,
):
    "Test add member."

    prj = project_model.create(mock_tapis_client, "Test Title", "PRJ-123", mock_owner)
    prj.storage.roles.for_user.return_value = MagicMock(role="USER", ADMIN="ADMIN")
    assert not prj._can_edit_member(mock_owner)

    mock_pi = django_user_model.objects.create_user(username="pi", password="password")

    with pytest.raises(NotAuthorizedError):
        prj.add_pi(mock_pi)

    assert prj.storage.roles.add.call_count == 0
    assert prj.storage.roles.save.call_count == 0
    assert not prj.metadata.pi


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_create_metadata(
    mock_owner, mock_tapis_client, mock_storage_system, project_model, mock_signal
):
    # Test creating metadata with no owner
    project_model._create_metadata("Project Title", "PRJ-123")
    assert ProjectMetadata.objects.get(project_id="PRJ-123").owner is None

    project_model._create_metadata("Project Title 2", "PRJ-124", mock_owner)
    assert ProjectMetadata.objects.get(project_id="PRJ-124").owner == mock_owner
