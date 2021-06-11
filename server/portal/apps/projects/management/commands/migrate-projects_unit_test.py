from portal.apps.projects.models.base import Project
from portal.apps.projects.models.metadata import ProjectMetadata
from django.core import management
from django.db.models import signals
import pytest


pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def disconnect_signal():
    yield signals.post_save.disconnect(sender=ProjectMetadata, dispatch_uid="index_project")


@pytest.fixture
def ownerless_project(django_db_reset_sequences):
    meta = ProjectMetadata.objects.create(
        title="project",
        project_id="CEP-1",
        description=None,
        created="2018-12-03T21:04:22.985Z",
        last_modified="2018-12-03T21:04:22.985Z",
        owner=None,
        pi=None,
    )
    meta.save()
    yield meta


@pytest.fixture
def mock_project_metadata(mocker, ownerless_project):
    yield mocker.patch.object(Project, '_get_metadata', return_value=ownerless_project)


@pytest.fixture
def mock_project_storage(mocker):
    yield mocker.patch.object(Project, '_get_storage')


@pytest.fixture
def mock_service_account(mocker):
    mock = mocker.patch('portal.apps.projects.management.commands.migrate-projects.service_account')
    yield mock.return_value


@pytest.fixture
def mock_index_project(mocker):
    mock = mocker.patch('portal.apps.search.tasks.index_project')
    yield mock


def test_migrate_projects(regular_user, mock_project_metadata, mock_project_storage, mock_index_project):
    mock_project_storage.return_value.roles.to_dict.return_value = {
        'wma_prtl': 'OWNER',
        'username': 'ADMIN'
    }
    management.call_command("migrate-projects")
    assert ProjectMetadata.objects.all()[0].pi.username == regular_user.username
    assert mock_index_project.apply_async.called


def test_migrate_projects_wrong_admins(regular_user, mock_project_metadata, mock_project_storage):
    mock_project_storage.return_value.roles.to_dict.return_value = {
        'wma_prtl': 'OWNER',
        'username': 'ADMIN',
        'username2': 'ADMIN'
    }
    management.call_command("migrate-projects")
    assert ProjectMetadata.objects.all()[0].pi is None
