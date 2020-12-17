import pytest
import os
import json
from mock import MagicMock
from requests.exceptions import HTTPError
from django.conf import settings
from portal.apps.notifications.models import Notification

pytestmark = pytest.mark.django_db


def test_get_no_allocation(client, authenticated_user, mocker, monkeypatch, mock_agave_client):
    mock_tapis_get = mocker.patch('portal.apps.datafiles.views.tapis_get_handler')
    mock_error = HTTPError()
    monkeypatch.setattr(
        mock_error, 'response', MagicMock(
            json=MagicMock(return_value={}),
            status_code=502
        )
    )
    mock_tapis_get.side_effect = mock_error

    mock_get_allocations = mocker.patch('portal.apps.datafiles.views.get_allocations')
    mock_get_allocations.return_value = {
        'hosts': []
    }

    mock_agave_client.systems.get.return_value = {
        'storage': {
            'host': 'frontera.tacc.utexas.edu'
        }
    }

    response = client.get('/api/datafiles/tapis/listing/private/frontera.home.username/')
    assert response.status_code == 403


def test_get_requires_push_keys(client, authenticated_user, mocker, monkeypatch, mock_agave_client):
    mock_tapis_get = mocker.patch('portal.apps.datafiles.views.tapis_get_handler')
    mock_error = HTTPError()
    monkeypatch.setattr(
        mock_error, 'response', MagicMock(
            json=MagicMock(return_value={}),
            status_code=502
        )
    )
    mock_tapis_get.side_effect = mock_error

    mock_get_allocations = mocker.patch('portal.apps.datafiles.views.get_allocations')
    mock_get_allocations.return_value = {
        'hosts': ['frontera.tacc.utexas.edu']
    }

    system = {
        'storage': {
            'host': 'frontera.tacc.utexas.edu'
        }
    }

    mock_agave_client.systems.get.return_value = system

    response = client.get('/api/datafiles/tapis/listing/private/frontera.home.username/')
    assert response.status_code == 502
    assert response.json() == {'system': system}


def test_generate_notification_on_request(client, authenticated_user, mocker, mock_agave_client):
    mocker.patch('portal.libs.agave.operations.agave_indexer')

    mock_response = {'nativeFormat': 'dir'}
    mock_agave_client.files.manage.return_value = mock_response

    response = client.put("/api/datafiles/tapis/move/private/frontera.home.username/test.txt/",
                          content_type="application/json",
                          data=json.dumps({"dest_path": "/testfol",
                                           "dest_system": "frontera.home.username"}))
    assert response.json() == {'data': mock_response}
    n = Notification.objects.last()
    extra_from_notification = n.to_dict()['extra']
    assert extra_from_notification == {'response': mock_response}
