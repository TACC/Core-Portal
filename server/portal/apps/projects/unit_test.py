"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""

import logging
from contextlib import contextmanager
from unittest.mock import MagicMock, patch

import pytest  # pyright: ignore
from django.conf import settings  # pyright: ignore
from tapipy.tapis import TapisResult

from portal.apps.projects.exceptions import NotAuthorizedError
from portal.apps.projects.workspace_operations import \
    shared_workspace_operations as ws_o

LOGGER = logging.getLogger(__name__)

pytestmark = pytest.mark.django_db


# Fixtures
@pytest.fixture
def mock_service_account(mocker):
    yield mocker.patch(
        "portal.apps.projects.models.base.service_account", autospec=True
    )


@pytest.fixture()
def mock_owner(django_user_model):
    return "username"


@pytest.fixture()
def mock_tapis_client():
    with patch("tapipy.tapis.Tapis") as mock_client:
        mock_client.mock_listing = []  # Potentially used for storage of systems
        mock_client.systems = MagicMock()
        mock_client.systems.getShareInfo = MagicMock()
        mock_client.systems.getSystem = MagicMock()
        mock_client.systems.grantUserPerms = MagicMock()
        mock_client.files.getPermissions = MagicMock()
        mock_client.systems.getSystems = MagicMock()
        mock_client.get_project = MagicMock()
        mock_client.systems.patchSystem = MagicMock()
        mock_client.get_project = MagicMock()

        # Testing attributes not in Tapis
        # Tracking what username is currently using Tapis for workspace operations
        mock_client.current_user = None

        def get_user():
            return mock_client.current_user

        def set_user(username):
            mock_client.current_user = username

        mock_client.get_user = get_user
        mock_client.set_user = set_user
        # Tracking System Count
        mock_client.notes = {"count": 1}

        def patch_system(systemId, notes):
            mock_client.notes["count"] = notes["count"]

        mock_client.systems.patchSystem.side_effect = patch_system

        def get_system(systemId):
            return TapisResult(notes={"count": mock_client.notes["count"]})

        mock_client.systems.getSystem.side_effect = get_system

        yield mock_client


# Helper function to handle patching
@contextmanager
def patch_workspace_operations():
    dir = "portal.apps.projects.workspace_operations.shared_workspace_operations"
    patches = [
        patch(f"{dir}.service_account"),
        patch(f"{dir}.create_workspace_system", wraps=ws_o.create_workspace_system),
        patch(f"{dir}.create_shared_workspace", wraps=ws_o.create_shared_workspace),
        patch(f"{dir}.increment_workspace_count", wraps=ws_o.increment_workspace_count),
        patch(f"{dir}.create_workspace_dir", wraps=ws_o.create_workspace_dir),
        patch(f"{dir}.set_workspace_acls", wraps=ws_o.set_workspace_acls),
        patch(f"{dir}.add_user_to_workspace", wraps=ws_o.add_user_to_workspace),
        patch(f"{dir}.get_project", wraps=ws_o.get_project),
    ]

    # Start all patches
    mocks = [p.start() for p in patches]
    try:
        # Yield the mocks to the with block
        yield mocks
    finally:
        # Stop all patches
        for p in patches:
            p.stop()


# Helper function for asserting the creation of one shared_workspace
def create_shared_workspace(
    client,
    title,
    mock_service_account,
    mock_owner,
    mock_create_shared_workspace,
    mock_increment_workspace_count,
    mock_create_workspace_dir,
    authenticated_user,
    workspace_num,
):
    # Create project
    project = ws_o.create_shared_workspace(client, title, mock_owner)
    mock_create_shared_workspace.assert_called_with(client, title, mock_owner)
    assert project == f"test.project.test.project-{workspace_num}"

    client.systems.getSystem.assert_called_with(
        systemId=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME
    )
    client.systems.patchSystem.assert_called_with(
        systemId=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
        notes={"count": workspace_num},
    )
    # Tapis instance with an admin account
    mock_service_account.return_value = client
    mock_service_account.assert_called()

    # Increment the workspace
    mock_increment_workspace_count.assert_called()
    mock_service_account.assert_called()

    # Create Workspace Dir
    mock_create_workspace_dir.assert_called()
    mock_service_account.assert_called()
    mock_service_account().files.mkdir.assert_called_with(
        systemId="projects.system.name", path=f"test.project-{workspace_num}"
    )
    # Set Workspace ACLS
    # Authenticated_user is whoever the mock_owner or creator of the project is
    mock_service_account().files.setFacl.assert_called_with(
        systemId="projects.system.name",
        path=f"test.project-{workspace_num}",
        operation="ADD",
        recursionMethod="PHYSICAL",
        aclString=f"d:u:{authenticated_user.username}:rwX,u:{authenticated_user.username}:rwX",
    )
    workspace_id = f"test.project-{workspace_num}"
    mock_create_workspace_dir.assert_called_with(workspace_id)
    return workspace_id


# Tests
# Test initial project creation, not shared workspace creation
def test_project_init(mock_tapis_client, mock_owner):
    with patch_workspace_operations() as mocks:
        mock_create_workspace_system = mocks[1]
        client = mock_tapis_client
        workspace_id = "test_workspace"
        title = "Test Workspace"
        description = "A test workspace"
        system_id = ws_o.create_workspace_system(
            client,
            workspace_id,
            title,
            description,
            owner=mock_owner,
        )
        mock_create_workspace_system.assert_called_once_with(
            client,
            workspace_id,
            title,
            description,
            owner=mock_owner,
        )
        assert system_id == f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
        # System args that are in create_workspace_system
        system_args = {
            "id": system_id,
            "host": settings.PORTAL_PROJECTS_ROOT_HOST,
            "port": int(settings.PORTAL_PROJECTS_SYSTEM_PORT),
            "systemType": "LINUX",
            "defaultAuthnMethod": "PKI_KEYS",
            "canExec": False,
            "rootDir": f"{settings.PORTAL_PROJECTS_ROOT_DIR}/{workspace_id}",
            "effectiveUserId": settings.PORTAL_ADMIN_USERNAME,
            "authnCredential": {
                "privateKey": settings.PORTAL_PROJECTS_PRIVATE_KEY,
                "publicKey": settings.PORTAL_PROJECTS_PUBLIC_KEY,
            },
            "notes": {"title": title, "description": description},
            "owner": mock_owner,
        }
        client.systems.createSystem.assert_called_with(**system_args)
        client.systems.getSystems.return_value = system_args  # If there are multiple projects, this is the one "mock returned" from "storage"

        # Assertion tests
        # Grab the current project that is in the storage that we want to assert
        prj = client.systems.getSystems()
        # Assert Basic Init Data
        assert prj["id"] == system_id
        assert prj["notes"]["title"] == title
        assert prj["notes"]["description"] == description


# Test for creating a shared workspace and if it creates a new project
def test_project_create(mock_tapis_client, mock_owner, authenticated_user):
    with patch_workspace_operations() as mocks:
        mock_service_account = mocks[0]
        mock_create_shared_workspace = mocks[2]
        mock_increment_workspace_count = mocks[3]
        mock_create_workspace_dir = mocks[4]
        # Initial Creation
        client = mock_tapis_client
        mock_service_account.return_value = mock_tapis_client
        title = "Test Workspace"
        create_shared_workspace(
            client,
            title,
            mock_service_account,
            mock_owner,
            mock_create_shared_workspace,
            mock_increment_workspace_count,
            mock_create_workspace_dir,
            authenticated_user,
            workspace_num=2,
        )
        # Expected TapisResult return
        expected_result = TapisResult(
            id="test.project.test.project-2",
            notes={"title": title, "description": ""},
            effectiveUserId="wma_prtl",
            port=22,
            authnCredential={"privateKey": settings.PORTAL_PROJECTS_PRIVATE_KEY},
        )
        # Validate createSystem call arguments
        created_project = client.systems.createSystem.call_args[1]
        assert created_project["id"] == expected_result.id
        assert created_project["notes"]["title"] == expected_result.notes.title
        assert (
            created_project["notes"]["description"] == expected_result.notes.description
        )
        assert created_project["effectiveUserId"] == expected_result.effectiveUserId
        assert created_project["port"] == expected_result.port
        assert (
            created_project["authnCredential"]["privateKey"]
            == expected_result.authnCredential.privateKey
        )


# Testing if there are two projects Tapis
def test_listing(mock_tapis_client, mock_owner, authenticated_user):
    with patch_workspace_operations() as mocks:
        mock_service_account = mocks[0]
        mock_create_shared_workspace = mocks[2]
        mock_increment_workspace_count = mocks[3]
        mock_create_workspace_dir = mocks[4]
        client = mock_tapis_client
        mock_service_account.return_value = mock_tapis_client
        title1 = "Test Workspace 1"
        title2 = "Test Workspace 2"

        # Mock return of getSystems based on views_unit_test.py
        mock_tapis_client.systems.getSystems.return_value = [
            TapisResult(
                id="test.project.test.project-2",
                host="cloud.data.tacc.utexas.edu",
                description="Test Workspace 1 description",
                notes={
                    "title": title1,
                    "description": "Description of Test Workspace 1",
                },
                updated="2023-03-07T19:31:17.292220Z",
                owner="owner_username",
                rootDir="/corral-repl/tacc/aci/CEP/projects/test.project-2",
            ),
            TapisResult(
                id="test.project.test.project-3",
                host="cloud.data.tacc.utexas.edu",
                description="Test Workspace 2 description",
                notes={
                    "title": title2,
                    "description": "Description of Test Workspace 2",
                },
                updated="2023-03-08T19:31:17.292220Z",
                owner="owner_username",
                rootDir="/corral-repl/tacc/aci/CEP/projects/test.project-3",
            ),
        ]

        # Create first project
        create_shared_workspace(
            client,
            title1,
            mock_service_account,
            mock_owner,
            mock_create_shared_workspace,
            mock_increment_workspace_count,
            mock_create_workspace_dir,
            authenticated_user,
            workspace_num=2,
        )
        # Create second project
        create_shared_workspace(
            client,
            title2,
            mock_service_account,
            mock_owner,
            mock_create_shared_workspace,
            mock_increment_workspace_count,
            mock_create_workspace_dir,
            authenticated_user,
            workspace_num=3,
        )
        projects = ws_o.list_projects(client)

        # Assertions
        assert len(projects) == 2
        assert projects[0]["id"] == "test.project.test.project-2"
        assert projects[0]["title"] == "Test Workspace 1"
        assert projects[0]["description"] == "Description of Test Workspace 1"
        assert projects[0]["owner"]["username"] == "owner_username"
        assert (
            projects[0]["path"] == "/corral-repl/tacc/aci/CEP/projects/test.project-2"
        )
        assert projects[0]["host"] == "cloud.data.tacc.utexas.edu"
        assert projects[0]["updated"] == "2023-03-07T19:31:17.292220Z"

        assert projects[1]["id"] == "test.project.test.project-3"
        assert projects[1]["title"] == "Test Workspace 2"
        assert projects[1]["description"] == "Description of Test Workspace 2"
        assert projects[1]["owner"]["username"] == "owner_username"
        assert (
            projects[1]["path"] == "/corral-repl/tacc/aci/CEP/projects/test.project-3"
        )
        assert projects[1]["host"] == "cloud.data.tacc.utexas.edu"
        assert projects[1]["updated"] == "2023-03-08T19:31:17.292220Z"


# TODO: These need to utilize get_workspace_role
# Test adding a member to a project
def test_add_member(mock_tapis_client, mock_owner, authenticated_user):
    with patch_workspace_operations() as mocks:
        mock_service_account = mocks[0]
        mock_create_shared_workspace = mocks[2]
        mock_increment_workspace_count = mocks[3]
        mock_create_workspace_dir = mocks[4]
        mock_add_user_to_workspace = mocks[6]
        mock_get_project = mocks[7]
        client = mock_tapis_client
        mock_service_account.return_value = mock_tapis_client
        # Initial Project Creation Setup
        client = mock_tapis_client
        # The service account usually has admin rights, but we need to override this to test unauthorized access later

        # NOTE: Test difference is here
        # username is the owner of the project
        client.set_user("username")

        mock_service_account.return_value = client

        title = "Test Workspace"
        workspace_id = create_shared_workspace(
            client,
            title,
            mock_service_account,
            mock_owner,
            mock_create_shared_workspace,
            mock_increment_workspace_count,
            mock_create_workspace_dir,
            authenticated_user,
            workspace_num=2,
        )

        # Not sure if this needs to go into client.systems.getSystem
        # Or just doing the following and mocking get_project
        mock_system_result = TapisResult(
            id="test.project.test.project-2",
            host="cloud.data.tacc.utexas.edu",
            description="Test Workspace 1 description",
            notes={
                "title": title,
                "description": "Description of Test Workspace 1",
            },
            updated="2023-03-07T19:31:17.292220Z",
            owner="username",
            rootDir="/corral-repl/tacc/aci/CEP/projects/test.project-2",
        )
        # Mock Project Before Adding
        mock_get_project.return_value = {
            "title": mock_system_result.notes.title,
            "description": getattr(mock_system_result.notes, "description", None),
            "created": mock_system_result.updated,
            "projectId": "test.project-2",
            "members": [
                {"user": ws_o.get_project_user("username"), "access": "owner"},
            ],
        }
        # Mock example of checking if a user is authenticated before attempting to test add_user_to_workspace
        owner_found = False
        for m in mock_get_project.return_value["members"]:
            m_username = m["user"]["username"]
            if client.get_user() == m_username:
                if m_username != mock_system_result.owner:
                    pytest.raises(NotAuthorizedError)
                owner_found = True
                break
        if not owner_found:
            pytest.raises(NotAuthorizedError)
            mock_add_user_to_workspace.assert_not_called()
            mock_get_project.assert_not_called()
            updated_project = ws_o.get_project(client, workspace_id)
            assert updated_project["members"] == [
                {"user": ws_o.get_project_user("username"), "access": "owner"},
            ]
        else:
            mock_add_user_to_workspace(client, workspace_id, "new_user", "writer")
            mock_get_project.assert_called_once_with(client, workspace_id)
            mock_service_account.assert_called()

            # TODO: Make new user a variable
            mock_service_account().files.setFacl.assert_called_with(
                systemId="projects.system.name",
                path="test.project-2",
                operation="ADD",
                recursionMethod="PHYSICAL",
                aclString="d:u:new_user:rwX,u:new_user:rwX",
            )

            # Mock Project After Adding
            mock_get_project.return_value = {
                "title": mock_system_result.notes.title,
                "description": getattr(mock_system_result.notes, "description", None),
                "created": mock_system_result.updated,
                "projectId": workspace_id,
                "members": [
                    {"user": ws_o.get_project_user("username"), "access": "owner"},
                    {"user": ws_o.get_project_user("new_user"), "access": "writer"},
                ],
            }
            updated_project = ws_o.get_project(client, workspace_id)
            assert updated_project["members"] == [
                {"user": ws_o.get_project_user("username"), "access": "owner"},
                {"user": ws_o.get_project_user("new_user"), "access": "writer"},
            ]


# Test adding a member but the user is unauthorized to
def test_add_member_unauthorized(mock_tapis_client, mock_owner, authenticated_user):
    with patch_workspace_operations() as mocks:
        mock_service_account = mocks[0]
        mock_create_shared_workspace = mocks[2]
        mock_increment_workspace_count = mocks[3]
        mock_create_workspace_dir = mocks[4]
        mock_add_user_to_workspace = mocks[6]
        mock_get_project = mocks[7]
        client = mock_tapis_client
        mock_service_account.return_value = mock_tapis_client
        # Initial Project Creation Setup
        client = mock_tapis_client
        # The service account usually has admin rights, but we need to override this to test unauthorized access later

        # NOTE: Test difference is here
        # username is the owner of the project
        client.set_user("unauthorized_user")

        mock_service_account.return_value = client

        title = "Test Workspace"
        workspace_id = create_shared_workspace(
            client,
            title,
            mock_service_account,
            mock_owner,
            mock_create_shared_workspace,
            mock_increment_workspace_count,
            mock_create_workspace_dir,
            authenticated_user,
            workspace_num=2,
        )

        # Not sure if this needs to go into client.systems.getSystem
        # Or just doing the following and mocking get_project
        mock_system_result = TapisResult(
            id="test.project.test.project-2",
            host="cloud.data.tacc.utexas.edu",
            description="Test Workspace 1 description",
            notes={
                "title": title,
                "description": "Description of Test Workspace 1",
            },
            updated="2023-03-07T19:31:17.292220Z",
            owner="username",
            rootDir="/corral-repl/tacc/aci/CEP/projects/test.project-2",
        )
        # Mock Project Before Adding
        mock_get_project.return_value = {
            "title": mock_system_result.notes.title,
            "description": getattr(mock_system_result.notes, "description", None),
            "created": mock_system_result.updated,
            "projectId": "test.project-2",
            "members": [
                {"user": ws_o.get_project_user("username"), "access": "owner"},
            ],
        }
        # Mock example of checking if a user is authenticated before attempting to test add_user_to_workspace
        owner_found = False
        for m in mock_get_project.return_value["members"]:
            m_username = m["user"]["username"]
            if client.get_user() == m_username:
                if m_username != mock_system_result.owner:
                    pytest.raises(NotAuthorizedError)
                owner_found = True
                break
        if not owner_found:
            pytest.raises(NotAuthorizedError)
            mock_add_user_to_workspace.assert_not_called()
            mock_get_project.assert_not_called()
            updated_project = ws_o.get_project(client, workspace_id)
            assert updated_project["members"] == [
                {"user": ws_o.get_project_user("username"), "access": "owner"},
            ]
        else:
            mock_add_user_to_workspace(client, workspace_id, "new_user", "writer")
            mock_get_project.assert_called_once_with(client, workspace_id)
            mock_service_account.assert_called()

            # TODO: Make new user a variable
            mock_service_account().files.setFacl.assert_called_with(
                systemId="projects.system.name",
                path="test.project-2",
                operation="ADD",
                recursionMethod="PHYSICAL",
                aclString="d:u:new_user:rwX,u:new_user:rwX",
            )

            # Mock Project After Adding
            mock_get_project.return_value = {
                "title": mock_system_result.notes.title,
                "description": getattr(mock_system_result.notes, "description", None),
                "created": mock_system_result.updated,
                "projectId": workspace_id,
                "members": [
                    {"user": ws_o.get_project_user("username"), "access": "owner"},
                    {"user": ws_o.get_project_user("new_user"), "access": "writer"},
                ],
            }
            updated_project = ws_o.get_project(client, workspace_id)
            assert updated_project["members"] == [
                {"user": ws_o.get_project_user("username"), "access": "owner"},
                {"user": ws_o.get_project_user("new_user"), "access": "writer"},
            ]


# TODO:Testing new shared workspace operations don't involve specific co pi creation functions or project metadata functions
# Tests now reflect remaining functions that were not covered in the tests above
@pytest.mark.skip(reason="TODO V3 Operation")
def test_get_workspace_role(mock_tapis_client, mock_owner, authenticated_user):
    return 0


@pytest.mark.skip(reason="TODO V3 Operation")
def test_change_user_role(mock_tapis_client, mock_owner, authenticated_user):
    return 0


@pytest.mark.skip(reason="TODO V3 Operation")
def test_remove_user(mock_tapis_client, mock_owner, authenticated_user):
    return 0


@pytest.mark.skip(reason="TODO V3 Operation")
def test_transfer_ownership(mock_tapis_client, mock_owner, authenticated_user):
    return 0


@pytest.mark.skip(reason="TODO V3 Operation")
def test_update_project(mock_tapis_client, mock_owner, authenticated_user):
    return 0
