import pytest
import json
import os
from django.conf import settings
from unittest.mock import MagicMock
from portal.apps.tas_project_systems.utils import get_tas_project_ids

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


@pytest.fixture
def tas_project_ids():
    yield [23881, 33198, 52]


def test_get_tas_project_ids(tas_project_ids):
    project_ids = get_tas_project_ids("mockuser")
    assert len(project_ids) == 3
    for project_id in project_ids:
        assert project_id in tas_project_ids
