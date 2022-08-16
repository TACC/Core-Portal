from mock import MagicMock
from django.conf import settings
from portal.apps.workspace.api.views import JobsView
from portal.apps.workspace.models import AppTrayCategory
from portal.apps.workspace.api.operations.tapis_v2 import (_get_app_id_by_spec,
                                                           _get_app_spec,
                                                           _get_public_apps,
                                                           _get_private_apps)
from portal.apps.workspace.models import JobSubmission
import json
import os
import pytest
import copy
from datetime import timedelta
from django.utils import timezone
from django.core.management import call_command


pytest.mark.django_db(transaction=True)


@pytest.fixture
def get_user_data(mocker):
    mock = mocker.patch('portal.apps.accounts.managers.user_systems.get_user_data')
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


@pytest.fixture
def apps_manager(mocker):
    mock_apps_manager = mocker.patch(
        'portal.apps.workspace.api.operations.tapis_v2.UserApplicationsManager'
    )
    # Patch the User Applications Manager to return a fake cloned app
    mock_app = MagicMock()
    mock_app.id = "mock_app"
    mock_app.exec_sys = False
    mock_apps_manager.return_value.get_or_create_app.return_value = mock_app
    yield mock_apps_manager


def test_get_appid_by_spec(mock_agave_client):
    compress_01u1 = {
        'id': 'compress-0.1u1',
        'name': 'compress',
        'version': '0.1',
        'revision': '1'
    }
    compress_01u2 = {
        'id': 'compress-0.1u2',
        'name': 'compress',
        'version': '0.1',
        'revision': '2'
    }
    compress_02u1 = {
        'id': 'compress-0.2u1',
        'name': 'compress',
        'version': '0.2',
        'revision': 1
    }
    # view = AppsTrayView()
    mock_agave_client.apps.list.return_value = [compress_01u1, compress_01u2]
    assert _get_app_id_by_spec(
        mock_agave_client, MagicMock(name='compress', version='0.1')) == 'compress-0.1u2'
    mock_agave_client.apps.list.return_value = [compress_01u2, compress_02u1]
    assert _get_app_id_by_spec(
        mock_agave_client, MagicMock(name='compress', version='0.1')) == 'compress-0.2u1'


def test_get_app(mocker, mock_agave_client, authenticated_user):
    mock_get_by_spec = mocker.patch('portal.apps.workspace.api.operations.tapis_v2._get_app_id_by_spec')
    mock_get_app = mocker.patch('portal.apps.workspace.api.operations.tapis_v2._get_app')
    #                                  'portal.apps.workspace.api.operations.tapis_v2._get_app'
    # view = AppsTrayView()

    # Try retrieving an app spec without a specific appId
    mock_spec = MagicMock(
        name='compress', version='0.1', appId=None, lastRetrieved='compress-0.1u1'
    )
    mock_get_by_spec.return_value = 'compress-0.1u1'
    _get_app_spec(mock_agave_client, mock_spec, authenticated_user)
    mock_get_app.assert_called_with('compress-0.1u1', mock_agave_client, authenticated_user)
    assert mock_get_app.called
    
    # Try retrieving a specific app ID and see that the lastRetrieved field is updated
    mock_spec.appId = 'compress-0.2u1'
    _get_app_spec(mock_agave_client, mock_spec, authenticated_user)
    assert mock_spec.lastRetrieved == 'compress-0.2u1'
    mock_get_app.assert_called_with('compress-0.2u1', mock_agave_client, authenticated_user)


def test_get_private_apps(authenticated_user, mock_agave_client, mocker):
    mock_get_app = mocker.patch('portal.apps.workspace.api.operations.tapis_v2._get_app')
    app = {
        'id': 'myapp-0.1',
        'label': 'My App',
        'version': '0.1',
        'revision': '1',
        'shortDescription': 'My App',
    }
    mock_agave_client.apps.list.return_value = [
        {
            'id': 'prtl.clone.hidden'
        },
        app
    ]
    mock_get_app.return_value = app
    expected_list = [copy.deepcopy(app)]
    expected_list[0]['type'] = 'agave'
    expected_list[0]['appId'] = 'myapp-0.1'
    expected_list[0].pop('id', None)
    assert _get_private_apps(mock_agave_client, authenticated_user) == expected_list


@pytest.mark.django_db(transaction=True)
def test_get_public_apps(django_db_setup, django_db_blocker, mocker,
                         mock_agave_client, authenticated_user):
    # Load fixtures
    with django_db_blocker.unblock():
        call_command('loaddata', 'app-tray.json')
    # Assert that fixtures were loaded
    assert len(AppTrayCategory.objects.all()) == 3
    categories, definitions = _get_public_apps(mock_agave_client)
    assert len(categories) == 3
    assert categories[0]['title'] == 'Simulation'
    assert len(categories[0]['apps']) == 1
