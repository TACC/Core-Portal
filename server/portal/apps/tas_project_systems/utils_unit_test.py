import pytest
import json
import os
from django.conf import settings
from portal.apps.tas_project_systems.utils import (
    get_tas_project_ids,
    get_datafiles_system_list,
    get_tas_project_system_variables,
    get_system_variables_from_project_sql_id
)
from django.core.management import call_command
from portal.apps.tas_project_systems.models import TasProjectSystemEntry
from elasticsearch.exceptions import NotFoundError

pytestmark = pytest.mark.django_db


@pytest.fixture
def tas_projects_for_user():
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_projects_for_user.json')))


@pytest.fixture(autouse=True)
def mock_tas(mocker, tas_projects_for_user):
    mock = mocker.patch('portal.apps.tas_project_systems.utils.TASClient')
    mock.return_value.projects_for_user.return_value = tas_projects_for_user
    yield mock


@pytest.fixture(autouse=True)
def tas_project_systems_fixtures(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command('loaddata', os.path.join(settings.BASE_DIR, 'fixtures/tas_project_systems.json'))
    yield None


@pytest.fixture(autouse=True)
def mock_create_substitutions(mocker):
    yield mocker.patch('portal.apps.system_creation.utils._create_substitutions', return_value={
        'tasdir': '01234/mockuser',
        'username': 'mockuser',
        'portal': 'mockportal'
    })


@pytest.fixture
def tas_project_ids():
    yield [23881, 33198, 52]


@pytest.fixture
def mock_get_tas_project_ids(mocker, tas_project_ids):
    yield mocker.patch('portal.apps.tas_project_systems.utils.get_tas_project_ids', return_value=tas_project_ids)


@pytest.fixture
def mock_IndexedTasProjectSystems(mocker):
    mock = mocker.patch('portal.apps.tas_project_systems.utils.IndexedTasProjectSystems')
    mock.from_username.return_value.value.to_dict.return_value = {
        'apcd-test.bcbs.mockuser': {
            'name': 'BCBS (APCD)',
            'description': 'Organizational storage for BCBS (APCD)',
            'site': 'cep',
            'systemId': 'apcd-test.bcbs.mockuser',
            'host': 'cloud.corral.tacc.utexas.edu',
            'rootDir': '/work/01234/mockuser/bcbs',
            'port': 2222,
            'icon': None,
            'hidden': False,
        },
        'apcd-test.submissions.mockuser': {
            'name': 'Submissions (APCD)',
            'description': 'Submission storage for (APCD)',
            'site': 'cep',
            'systemId': 'apcd-test.submissions.mockuser',
            'host': 'cloud.corral.tacc.utexas.edu',
            'rootDir': '/work/01234/mockuser/submissions',
            'port': 2222,
            'icon': None,
            'hidden': False,
        }
    }
    yield mock


def test_get_tas_project_ids(tas_project_ids):
    project_ids = get_tas_project_ids("mockuser")
    assert len(project_ids) == 3
    for project_id in project_ids:
        assert project_id in tas_project_ids


def test_get_system_variables_for_project_sql_id(regular_user):
    variables = get_system_variables_from_project_sql_id(regular_user, 23881)
    assert variables == {
        'apcd-test.bcbs.mockuser': {
            'name': 'BCBS (APCD)',
            'description': 'Organizational storage for BCBS (APCD)',
            'site': 'cep',
            'systemId': 'apcd-test.bcbs.mockuser',
            'host': 'cloud.corral.tacc.utexas.edu',
            'rootDir': '/work/01234/mockuser/bcbs',
            'port': 2222,
            'icon': None,
            'hidden': False,
        }
    }


def test_get_tas_project_system_variables(regular_user, mock_IndexedTasProjectSystems):
    variables = get_tas_project_system_variables(regular_user)
    assert len(variables) == 2


def test_get_tas_project_system_variables_not_found(regular_user, mock_IndexedTasProjectSystems, mock_get_tas_project_ids):
    mock_IndexedTasProjectSystems.from_username.side_effect = NotFoundError
    variables = get_tas_project_system_variables(regular_user)
    assert len(variables) == 2
    mock_IndexedTasProjectSystems.return_value.save.assert_called()


def test_get_tas_project_system_variables_forced(regular_user, mock_IndexedTasProjectSystems, mock_get_tas_project_ids):
    variables = get_tas_project_system_variables(regular_user, force=True)
    assert len(variables) == 2
    mock_IndexedTasProjectSystems.return_value.save.assert_called()


def test_get_datafiles_system_list(regular_user, mock_IndexedTasProjectSystems):
    assert get_datafiles_system_list(regular_user) == [
        {
            'name': 'BCBS (APCD)',
            'scheme': 'private',
            'system': 'apcd-test.bcbs.mockuser',
            'icon': None,
            'hidden': False,
            'api': 'tapis'
        },
        {
            'name': 'Submissions (APCD)',
            'scheme': 'private',
            'system': 'apcd-test.submissions.mockuser',
            'icon': None,
            'hidden': False,
            'api': 'tapis'
        }
    ]
