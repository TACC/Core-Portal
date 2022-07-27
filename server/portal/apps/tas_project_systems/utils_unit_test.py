import pytest
import json
import os
from django.conf import settings
from unittest.mock import MagicMock
from portal.apps.tas_project_systems.utils import (
    get_tas_project_ids,
    get_datafiles_system_list,
    get_system_variables_from_project_entry
)
from django.core.management import call_command
from portal.apps.tas_project_systems.models import TasProjectSystemEntry


pytestmark = pytest.mark.django_db


@pytest.fixture
def tas_projects_for_user():
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_projects_for_user.json')))


@pytest.fixture(autouse=True)
def mock_tas(mocker, tas_projects_for_user):
    mocker.patch('portal.apps.tas_project_systems.utils.TASClient', return_value=MagicMock(
        projects_for_user=MagicMock(
            return_value=tas_projects_for_user
        )
    ))


@pytest.fixture(autouse=True)
def tas_project_systems_fixtures(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command('loaddata', os.path.join(settings.BASE_DIR, 'fixtures/tas_project_systems.json'))
    yield None


@pytest.fixture(autouse=True)
def mock_create_substitutions(mocker):
    mocker.patch('portal.apps.system_creation.utils._create_substitutions', return_value={
        'tasdir': '01234/mockuser',
        'username': 'mockuser',
        'portal': 'mockportal'
    })


@pytest.fixture
def tas_project_ids():
    yield [23881, 33198, 52]


def test_get_tas_project_ids(tas_project_ids):
    project_ids = get_tas_project_ids("mockuser")
    assert len(project_ids) == 3
    for project_id in project_ids:
        assert project_id in tas_project_ids


def test_get_system_variables_for_project_entry(regular_user):
    bcbs_project_entry = TasProjectSystemEntry.objects.all().filter(project_sql_id=23881)[0]
    variables = get_system_variables_from_project_entry(regular_user, bcbs_project_entry)
    assert variables == ('cloud.corral.BCBS.mockuser', {
        'name': 'BCBS (APCD)',
        'description': 'Organizational storage for BCBS (APCD)',
        'host': 'cloud.corral.tacc.utexas.edu',
        'rootDir': '/corral-secure/tacc/apcd/bcbs',
        'site': 'cep',
        'systemId': 'cloud.corral.BCBS.mockuser',
        'hidden': False,
        'icon': None,
        'port': 2222
    })


def test_get_datafiles_system_list(mocker, regular_user):
    assert get_datafiles_system_list(regular_user) == [
        {
            'name': 'BCBS (APCD)',
            'scheme': 'private',
            'system': 'cloud.corral.BCBS.mockuser',
            'icon': None,
            'hidden': False,
            'api': 'tapis'
        },
        {
            'name': 'Submissions (APCD)',
            'scheme': 'private',
            'system': 'cloud.corral.submissions.mockuser',
            'icon': None,
            'hidden': False,
            'api': 'tapis'
        }
    ]
