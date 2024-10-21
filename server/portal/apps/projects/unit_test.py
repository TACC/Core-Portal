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
    return django_user_model.objects.create_user(
        username="username", password="password"
    )


# Mock creation of a project

# Minimal mocks, only do behavior based testing instead of implementation based testing


@pytest.fixture()
def mock_tapis_client():
    with patch("tapipy.tapis.Tapis") as MockTapis:
        mock_client = MockTapis.return_value
        # Tapis server actions to Mock
        # create_workspace_system calls
        mock_client.systems.createSystem = MagicMock()
        # get_project calls
        mock_client.systems.getShareInfo = MagicMock()
        mock_client.systems.getSystem = MagicMock()
        mock_client.files.getPermissions = MagicMock()
        yield mock_client


# Initial setup of mocks
@pytest.fixture()
def setup_mocks(mock_tapis_client):
    result_title = "My New Workspace"
    result_description = "This is a test description"
    result_created = "2024-10-18T00:00:00Z"

    # Mock Tapis Client
    client = mock_tapis_client

    # Mock shares return
    mock_shares = MagicMock()
    mock_shares.users = ["owner", "user"]
    client.systems.getShareInfo.return_value = mock_shares

    # Mock system return
    mock_system = MagicMock()
    mock_system.owner = "owner"
    mock_system.notes.title = result_title
    mock_system.notes.description = result_description
    mock_system.created = result_created
    client.systems.getSystem.return_value = mock_system

    # Mock permission return
    def mock_get_permissions(systemId, path, username):
        if username == "user":
            return MagicMock(permission="MODIFY")
        return MagicMock(permission="NONE")

    client.files.getPermissions.side_effect = mock_get_permissions

    return client


def test_project_init(setup_mocks):
    "Test project model init."

    # Assert Defs
    result_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.PRJ-123"
    result_title = "My New Workspace"
    result_description = "This is a test description"
    result_created = "2024-10-18T00:00:00Z"

    # Mock Tapis Client
    client = setup_mocks

    # Create the shared workspace
    project_id = ws_o.create_workspace_system(
        client,
        workspace_id="PRJ-123",
        title=result_title,
        description=result_description,
        owner=None,
    )

    # Assert the results
    assert project_id == result_system_id
    project = ws_o.get_project(client, project_id)
    assert project["title"] == result_title
    assert project["description"] == result_description
    assert project["created"] == result_created
    assert project["projectId"] == result_system_id
    assert len(project["members"]) == 2
    assert project["members"][0]["user"]["username"] == "owner"
    assert project["members"][0]["access"] == "owner"
    assert project["members"][1]["user"]["username"] == "user"
    assert project["members"][1]["access"] == "edit"


def test_project_create(setup_mocks, mock_owner, mock_service_account):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account"
    ) as mock_service_account, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count"
    ) as mock_increment_workspace_count, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir"
    ) as mock_create_workspace_dir, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls"
    ) as mock_set_workspace_acls:

        client = setup_mocks
        result_system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.test.project-123"
        # Set return values for the mocks
        mock_service_account.return_value = MagicMock()

        # Mock of increment_workspace_count
        workspace_count = 122  # Example starting workspace

        def increment_workspace():
            nonlocal workspace_count
            workspace_count += 1
            return workspace_count

        mock_increment_workspace_count.side_effect = increment_workspace

        # Create shared workspace test
        project_id = ws_o.create_shared_workspace(client, "PRJ-123", mock_owner)
        assert project_id == result_system_id
        # Assert that the mocks were called
        mock_service_account.assert_called_once()
        mock_increment_workspace_count.assert_called_once()
        mock_create_workspace_dir.assert_called_once_with(
            f"{settings.PORTAL_PROJECTS_ID_PREFIX}-123"
        )

        mock_set_workspace_acls.assert_called_once_with(
            mock_service_account.return_value,
            settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
            f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}-123",
            mock_owner,
            "add",
            "writer",
        )
        # TODO: Mocking the storage found at line 187 for storage and auth
    """ Original Tests
    prj = project_model.create(mock_tapis_client, "Test Title", "PRJ-123", mock_owner)
    project_model._create_dir.assert_called_with("PRJ-123")
    mock_storage_system.assert_called_with(
        client=service_account(),
        id="test.project.PRJ-123",
        name="PRJ-123",
        description="Test Title",
        site="test",
    )
    assert ProjectMetadata.objects.all().count() == 1
    assert ProjectMetadata.objects.get(project_id="PRJ-123", title="Test Title")

    assert prj._ac == mock_tapis_client
    assert prj.storage.storage.port == 22

    assert prj.storage.storage.auth.username == "wma_prtl"
    assert prj.storage.storage.auth.private_key == (
        "-----BEGIN RSA PRIVATE KEY-----" "change this" "-----END RSA PRIVATE KEY-----"
    )

    """


def test_listing(setup_mocks, mock_owner):
    with patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account"
    ) as mock_service_account, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.increment_workspace_count"
    ) as mock_increment_workspace_count, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.create_workspace_dir"
    ) as mock_create_workspace_dir, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.set_workspace_acls"
    ) as mock_set_workspace_acls, patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.list_projects"
    ) as mock_list_projects:
        "Test projects listing."

        # Mock Tapis Initial
        client = setup_mocks

        # Create two projects/workspaces
        project_id_1 = ws_o.create_shared_workspace(client, "PRJ-123", mock_owner)
        project_id_2 = ws_o.create_shared_workspace(client, "PRJ-124", mock_owner)

        # Mock the return value of list_projects
        # TODO: List Projects needs to match the output of the shared workspace operations
        mock_list_projects.return_value = [
            {"project_id": project_id_1, "title": "Project 123"},
            {"project_id": project_id_2, "title": "Project 124"},
        ]

        # Call the function to list projects
        projects = ws_o.list_projects(client)

        # Assert that the mocks were called
        mock_increment_workspace_count.assert_called()
        mock_create_workspace_dir.assert_called()
        mock_set_workspace_acls.assert_called()
        mock_list_projects.assert_called_once_with(client)

        # Verify the returned projects
        assert len(projects) == 2
        assert projects[0]["project_id"] == project_id_1
        assert projects[0]["title"] == "Project 123"
        assert projects[1]["project_id"] == project_id_2
        assert projects[1]["title"] == "Project 124"
        """
        mock_storage_system.search.return_value = mock_projects_storage_systems
        lst = list(Project.listing(mock_tapis_client))
        mock_storage_system.search.assert_called_with(
            mock_tapis_client,
            query={
                "id.like": "{}*".format(Project.metadata_name),
                "type.eq": mock_storage_system.TYPES.STORAGE,
            },
            offset=0,
            limit=100,
        )
        assert len(lst) == 2
        """


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_add_member(
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
    prj.storage.roles.for_user.return_value = MagicMock(role="ADMIN", ADMIN="ADMIN")
    assert prj._can_edit_member(mock_owner)

    mock_team_member = django_user_model.objects.create_user(
        username="teamMember", password="password"
    )
    prj.add_member(mock_team_member)

    prj.storage.roles.add.assert_called_with("teamMember", "USER")
    assert prj.storage.roles.save.call_count == 1
    assert prj.metadata.team_members.get(username="teamMember")

    prj.remove_member(mock_team_member)
    with pytest.raises(django_user_model.DoesNotExist):
        prj.metadata.team_members.get(username="teamMember")


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
