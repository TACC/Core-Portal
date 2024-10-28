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
    with patch("tapipy.tapis.Tapis") as mock_client:
        mock_listing = []

        class DictObj:
            # Default Init
            def __init__(self, **entries):
                # Recursive conversion of nested dictionaries into object for attribute reference
                # This is needed because of the behavior of shared_workspace_operations.py and its usage of objects from JSON
                for key, value in entries.items():
                    print(f"Creating KVP with {key},{value}")
                    if isinstance(value, dict):
                        self.__dict__[key] = DictObj(**value)
                    else:
                        self.__dict__[key] = value

            # Default Get function
            def get(self, key, default=None):
                return getattr(self, key, default)

            def __len__(self):
                return len(self.__dict__)

            def __getitem_(self, key):
                return self.__dict__[key]

            # TODO: This could be the get project instead of just sending in a key of "id" send in the
            # key value of the id to return the payload
            def get_project(self, key):
                if key in self.__dict__:
                    id = self.get("id")
                    port = self.get("port")
                    created = self.get("created")
                    users = self.get("users")
                    title = description = private_key = None
                    for value in self.__dict__.values():
                        if isinstance(value, DictObj):
                            first_key = next(iter(value.__dict__), None)
                            if first_key == "title":
                                title = value.get("title")
                                description = value.get("description")
                            elif first_key == "privateKey":
                                private_key = value.get("privateKey")
                    print(f"The users are {users}")
                    data = {
                        "title": title,
                        "description": description,
                        "created": created,
                        "projectId": id,
                        "port": port,
                        "members": users,
                        "privateKey": private_key,
                    }
                    return data

            # Create/Update
            def update_user(self, id, key, value):
                if self.__dict__.get("id") == id:
                    print(f"Updating Project {id}, {key} with {value}")
                    users = self.__dict__.get("users", {})
                    user = users.get(key)

                    if user:
                        print(f"User exists: {user.__dict__}")
                        user.__dict__["permissions"] = value
                        print(f"Permissions updated to: {user.__dict__['permissions']}")
                    else:
                        print("User does not exist")

                    # self.__dict__[key] = value
                    # print(f"New values {key}, {self.__dict__[key]}")
                return id

        # Mocks of the specific Tapis Actions that can occur
        # Mock createSystem with the side effect
        def create_system_side_effect(**system_args):
            system_created = "2024-10-18T00:00:00Z"
            system_args["users"] = {
                "username": {"username": "username", "permissions": []}
            }
            system_args["created"] = system_created
            system_args["updated"] = system_created
            if "owner" not in system_args:
                system_args["owner"] = None
            system_obj = DictObj(**system_args)
            mock_listing.append(system_obj)

        def get_system_side_effect(systemId):
            # TODO: Change for multiple systems, tests only one system for now
            return mock_listing[0]

        def get_project_side_effect(workspace_id):
            for project in mock_listing:
                return project.get_project("id")

        def get_systems_side_effect(*args, **kwargs):
            mock_get_Systems_return = mock_listing
            return mock_get_Systems_return

        # Permissions
        def grant_user_perms_side_effect(systemId, userName, permissions):
            print("Test here")
            print(systemId, userName, permissions)
            print(f"Find system with id {systemId}")
            print(f" And add the user {userName} with permissions {permissions}")
            # Find the system in the mock_listing, target the specific data entry, update the entry
            for project in mock_listing:
                return project.update_user(systemId, userName, permissions)

        mock_client.systems.createSystem = MagicMock(
            side_effect=create_system_side_effect
        )
        mock_client.systems.getShareInfo = MagicMock()
        mock_client.systems.getSystem = MagicMock(side_effect=get_system_side_effect)
        # mock_client.systems.grantUserPerms = MagicMock()
        mock_client.systems.grantUserPerms = MagicMock(
            side_effect=grant_user_perms_side_effect
        )
        mock_client.files.getPermissions = MagicMock()
        mock_client.systems.getSystems = MagicMock(side_effect=get_systems_side_effect)
        mock_client.get_project = MagicMock(side_effect=get_project_side_effect)

        yield mock_client


# Test for creating a project without the shared workspace component
def test_project_init(mock_tapis_client, mock_owner):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.get_project_user"
    ) as mock_get_project_user, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.get_project",
        wraps=ws_o.get_project,
    ):
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


# Test for creating a shared workspace and if it creates a new project
def test_project_create(mock_tapis_client, mock_owner):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account",
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_shared_workspace",
        wraps=ws_o.create_shared_workspace,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count",
        wraps=ws_o.increment_workspace_count,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir",
        wraps=ws_o.create_workspace_dir,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls",
        wraps=ws_o.set_workspace_acls,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,
    ):
        # Intial assertions
        title = "PRJ-123"
        description = ""
        created = "2024-10-18T00:00:00Z"
        # Mock Tapis Initial
        client = mock_tapis_client
        # Create Test project to test workspace operation, this is testing for no given description and it making a workspace system call
        workspace_id = "test.project-2"
        system_id = ws_o.create_shared_workspace(client, title, mock_owner)

        # Calls and Mock calls in create_shared_workspace
        ws_o.service_account.assert_called()
        ws_o.increment_workspace_count.assert_called()
        ws_o.create_workspace_dir.assert_called_with(workspace_id)
        ws_o.set_workspace_acls.assert_called()  # TODO: Calls to make a workspace permission,might need to be mocked
        ws_o.create_workspace_system.assert_called_once_with(
            client,
            workspace_id,
            title,
        )

        # Mocking the ws_o.get_project, using the mocked version I made in the Tapis mock
        project = client.get_project(workspace_id=system_id)

        # Check return payload data format
        assert project["port"] == 22
        assert project["privateKey"] == (
            "-----BEGIN RSA PRIVATE KEY-----"
            "change this"
            "-----END RSA PRIVATE KEY-----"
        )
        assert project["title"] == title
        assert project["description"] == description
        assert project["created"] == created
        assert project["projectId"] == system_id
        assert len(project["members"]) == 1
        assert project.get("members").get("username").get("username") == "username"


# Mock of counter for increment_workspace_count
@pytest.fixture
def increment_counter():
    counter = {"count": 0}

    def side_effect():
        counter["count"] += 1
        return f"{counter['count']}"

    return counter, side_effect


# Testing if there are two projects Tapis
def test_listing(mock_tapis_client, mock_owner, increment_counter):
    counter, side_effect = increment_counter
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account",
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_shared_workspace",
        wraps=ws_o.create_shared_workspace,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count",
        side_effect=side_effect,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir",
        wraps=ws_o.create_workspace_dir,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls",
        wraps=ws_o.set_workspace_acls,
    ), patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_system",
        wraps=ws_o.create_workspace_system,
    ):

        # Intial assertions
        # Mock Tapis Initial
        client = mock_tapis_client

        # First Project
        title = "PRJ-123"
        description = ""
        created = "2024-10-18T00:00:00Z"

        # Create Test project to test workspace operation, this is testing for no given description and it making a workspace system call
        workspace_id = "test.project-1"
        system_id = ws_o.create_shared_workspace(client, title, mock_owner)

        # Calls and Mock calls in create_shared_workspace
        ws_o.service_account.assert_called()
        ws_o.increment_workspace_count.assert_called()
        ws_o.create_workspace_dir.assert_called_with(workspace_id)
        ws_o.set_workspace_acls.assert_called()  # TODO: Calls to make a workspace permission,might need to be mocked
        ws_o.create_workspace_system.assert_called_with(
            client,
            workspace_id,
            title,
        )
        project = client.get_project(workspace_id=system_id)
        assert project["description"] == description
        assert project["created"] == created

        # Second Project
        title2 = "PRJ-456"
        description2 = ""
        created2 = "2024-10-18T00:00:00Z"

        # Create Test project to test workspace operation, this is testing for a given description and it making a workspace system call
        workspace_id2 = "test.project-2"
        system_id2 = ws_o.create_shared_workspace(client, title2, mock_owner)

        # Calls and Mock calls in create_shared_workspace
        ws_o.service_account.assert_called()
        ws_o.increment_workspace_count.assert_called()
        ws_o.create_workspace_dir.assert_called_with(workspace_id2)
        ws_o.set_workspace_acls.assert_called()  # TODO: Calls to make a workspace permission, might need to be mocked
        ws_o.create_workspace_system.assert_called_with(
            client,
            workspace_id2,
            title2,
        )
        project2 = client.get_project(workspace_id=system_id2)
        assert project2["description"] == description2
        assert project2["created"] == created2

        # Test the listing of list_projects
        list = ws_o.list_projects(client)
        fields = "id,host,description,notes,updated,owner,rootDir"
        query = f"id.like.{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.*"
        client.systems.getSystems.assert_called_with(
            listType="ALL", search=query, select=fields, limit=-1
        )
        assert len(list) == 2


def test_add_member(mock_tapis_client, mock_owner, django_user_model):
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
        # Assert Defs
        result_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.PRJ-123"
        result_title = "My New Workspace"
        result_description = "This is a test description"
        # result_created = "2024-10-18T00:00:00Z"
        # mock_get_project_user.return_value = {"username": "mock_user"}
        # Mock Tapis Client
        client = mock_tapis_client
        # Create the shared workspace
        workspace_id = "PRJ-123"
        # TODO: This must work for a new member, default is username currently, must work for another name
        username = "username"
        role = "writer"
        system_id = ws_o.create_workspace_system(
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
        assert result_system_id == system_id
        ws_o.add_user_to_workspace(client, workspace_id, username, role)
        ws_o.service_account.assert_called()
        ws_o.set_workspace_acls.assert_called()
        ws_o.set_workspace_permissions.assert_called_with(
            client, username, system_id, role
        )
        # Assertions
        project = client.get_project(workspace_id=result_system_id)
        # Check return payload data format
        print("What is the new member list permissions")
        # Right here the name is the member is username
        print(project.get("members").get("username").get("permissions"))
        assert project["port"] == 22


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
