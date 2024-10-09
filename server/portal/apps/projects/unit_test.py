"""Tests.

.. :module:: portal.apps.projects.unit_test
   :synopsis: Projects app unit tests.
"""

import logging
from unittest.mock import MagicMock

import pytest  # pyright: ignore

from portal.apps.projects.exceptions import NotAuthorizedError
from portal.apps.projects.models.base import Project
from portal.apps.projects.models.metadata import ProjectMetadata

LOGGER = logging.getLogger(__name__)

pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_service_account(mocker):
    yield mocker.patch(
        "portal.apps.projects.models.base.service_account", autospec=True
    )


@pytest.fixture()
def mock_signal(mocker):
    yield mocker.patch("portal.apps.signals.receivers.index_project")


@pytest.fixture()
def mock_owner(django_user_model):
    return django_user_model.objects.create_user(
        username="username", password="password"
    )


# Start my fixtures


# Mock creation of a project
@pytest.fixture()
def mock_tapis_client():
    return MagicMock()


# TODO: Convert this to become a mocker patch of the Metadata object, similar to mock_create_project
# List of Metadata per project
@pytest.fixture()
def mock_metadata():
    metadata = MagicMock()

    def mock_init(title):
        metadata.defaults = {"title": title}

    metadata.side_effect = mock_init
    return metadata


# Potentially holds a list of projects by the user
@pytest.fixture()
def mock_storage_system(mocker):
    mock = mocker.MagicMock()
    mock.description = "All Project Storage"

    def mock_init(client, project_id):
        mock.client = client
        mock.project = project_id
        mock.last_modified = "10-09-2024"
        return mock

    mock.side_effect = mock_init
    return mock


@pytest.fixture()
def mock_create_project(mocker):
    mock = mocker.patch(
        "portal.apps.projects.models.Project.storage",
        autospec=True,
    )

    def mock_init(mock_storage_system, client, project_id, metadata=None, storage=None):
        mock.client = client
        mock.project_id = project_id
        if storage is None:
            mock.storage = mock_storage_system(client, mock.project_id)
        return mock

    mock.side_effect = mock_init
    return mock


def test_project_init(
    mock_tapis_client, mock_storage_system, mock_metadata, mock_create_project
):
    "Test project model init."
    # Mock a project creation
    assert mock_storage_system.description == "All Project Storage"

    """
    # Test with no initial storage or metadata
    prj = mock_create_project(mock_tapis_client, "PRJ-123")
    mock_create_project.assert_called_with(mock_tapis_client, "PRJ-123")
    assert prj.project_id == "PRJ-123"

    prj2 = mock_create_project(
        mock_tapis_client, "PRJ-124", mock_metadata, mock_storage_system
    )
    mock_create_project.assert_called_with(
        mock_tapis_client, "PRJ-124", mock_metadata, mock_storage_system
    )
    assert prj2.storage.last_modified == "10-09-2024"
    assert prj2.storage.description == "my test description"
    """

    id = "{prefix}.{project_id}".format(
        prefix=Project.metadata_name, project_id="PRJ-123"
    )

    prj = mock_create_project(
        client=mock_tapis_client,
        project_id=id,
        mock_storage_system=mock_storage_system,
    )
    assert prj.project_id == id

    # With Storage Systems
    # In order to assert this, this needs to be called in a create project, then storage data would have to be made
    mock_storage_system.assert_called_with(mock_tapis_client, id)
    # Without Storage Systems (not possible, code is commented out to be depreicated see models/base.py)

    # TODO: Uncomment out and test that metadata shows and passses these tests
    # assert ProjectMetadata.objects.all().count() == 1
    # assert ProjectMetadata.objects.get(project_id="PRJ-123", title="my title")


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_project_create(
    mock_owner,
    mock_tapis_client,
    service_account,
    mock_storage_system,
    project_model,
    mock_signal,
):
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


@pytest.mark.skip(reason="TODOv3: update with new Shared Workspaces operations")
def test_listing(
    mock_storage_system, mock_tapis_client, mock_signal, mock_projects_storage_systems
):
    "Test projects listing."
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
