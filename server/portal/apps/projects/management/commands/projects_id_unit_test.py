from io import StringIO
import pytest
from django.core.management import call_command
from portal.apps.projects.models.utils import get_latest_project_storage, get_latest_project_directory


pytestmark = pytest.mark.django_db


@pytest.fixture
def mock_project_listing(mocker):
    project_mock = mocker.patch('portal.apps.projects.models.utils.Project')
    project_mock.listing.return_value = []
    yield project_mock


@pytest.fixture
def mock_project_listing_with_projects(mocker, mock_projects):
    project_mock = mocker.patch('portal.apps.projects.models.utils.Project')
    project_mock.listing.return_value = mock_projects


@pytest.fixture
def mock_iterate_listings(mocker):
    iterate_listing_mock = mocker.patch('portal.apps.projects.models.utils.iterate_listing')
    iterate_listing_mock.return_value = []
    yield iterate_listing_mock


@pytest.fixture()
def mock_service_account(mocker):
    yield mocker.patch('portal.apps.projects.models.utils.service_account', autospec=True)


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_get_latest_project_storage(mock_project_listing, mock_service_account):
    assert get_latest_project_storage() == -1


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_get_latest_project_directory(mock_iterate_listings, mock_service_account):
    assert get_latest_project_directory() == -1


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_default_command_with_no_projects(mock_iterate_listings, mock_project_listing, mock_service_account):
    out = StringIO()
    call_command("projects_id", stdout=out)
    output = out.getvalue()
    assert "There are no project storage systems" in output
    assert "There are no project directories" in output
    assert "Latest storage system project id: -1" in output
    assert "Latest directory project id: -1" in output
    assert "Latest project id in ProjectId model: None" in output


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_default_command_with_two_projects(mock_iterate_listings, mock_project_listing_with_projects, mock_service_account):
    out = StringIO()
    call_command("projects_id", stdout=out)
    output = out.getvalue()
    assert "Latest storage system project id: 124" in output
    assert "Latest directory project id: -1" in output
    assert "Latest project id in ProjectId model: None" in output


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_update(mock_iterate_listings, mock_project_listing, mock_service_account):
    out = StringIO()
    call_command("projects_id", "--update", "42", stdout=out)
    output = out.getvalue()
    assert "Updating to user provided value of: 42" in output


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_update_using_storage_system_id(mock_iterate_listings, mock_project_listing, mock_service_account):
    out = StringIO()
    call_command("projects_id", "--update-using-max-value-found", stdout=out)
    output = out.getvalue()
    assert "Updating to value latest storage system id: 0" in output


@pytest.mark.skip(reason="TODOv3: update test after projects implemented")
def test_update_using_storage_system_id_with_two_projects(mock_iterate_listings, mock_project_listing_with_projects, mock_service_account):
    out = StringIO()
    call_command("projects_id", "--update-using-max-value-found", stdout=out)
    output = out.getvalue()
    assert "Latest storage system project id: 124" in output
    assert "Updating to value latest storage system id: 124" in output
