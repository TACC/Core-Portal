import pytest
import json
import os
import pytz
from datetime import datetime
from django.conf import settings
from django.http import Http404


@pytest.fixture
def system_status_old(scope="module"):
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/system_monitor/index.json')))


@pytest.fixture
def system_status(system_status_old, scope="module"):
    # alter time stamps so that the system status looks like it was collected recently
    altered_system_status = system_status_old.copy()
    system = altered_system_status['Frontera']
    for test_entry in system['tests']:
        system['tests'][test_entry]['timestamp'] = str(pytz.utc.localize(datetime.now()))
    yield altered_system_status


@pytest.fixture
def system_status_missing_frontera(scope="module"):
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/system_monitor/index_missing_frontera.json')))


@pytest.mark.django_db()
def test_system_monitor_get(client, settings, requests_mock, system_status):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['Frontera']
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status)
    response = client.get('/api/system-monitor/')
    assert response.status_code == 200
    system = response.json()[0]
    assert system['hostname'] == 'frontera.tacc.utexas.edu'
    assert system['display_name'] == 'Frontera'
    assert system['load_percentage'] == 98
    assert system['jobs']['running'] == 402
    assert system['jobs']['queued'] == 506
    assert system['jobs']['other'] == 110
    assert system['is_operational']


@pytest.mark.django_db()
def test_system_monitor_get_old_timestamp_triggers_non_operational(client, settings, requests_mock, system_status_old):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['Frontera']
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status_old)
    response = client.get('/api/system-monitor/')
    assert response.status_code == 200
    system = response.json()[0]
    assert system['hostname'] == 'frontera.tacc.utexas.edu'
    assert system['display_name'] == 'Frontera'
    assert not system['is_operational']


@pytest.mark.django_db()
def test_system_monitor_when_missing_system(client, settings, requests_mock, system_status_missing_frontera):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['Frontera']
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status_missing_frontera)
    response = client.get('/api/system-monitor/')
    assert response.status_code == 200
    system = response.json()[0]
    assert system['hostname'] == 'frontera.tacc.utexas.edu'
    assert system['display_name'] == 'Frontera'
    assert not system['is_operational']
    assert system['load_percentage'] == 0
    assert system['jobs']['running'] == 0
    assert system['jobs']['queued'] == 0
    assert system['jobs']['other'] == 0


@pytest.mark.django_db()
def test_system_monitor_when_display_list_is_empty(client, settings, requests_mock, system_status):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = []
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status)
    response = client.get('/api/system-monitor/')
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db()
def test_system_monitor_when_status_endpoint_fails(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['Frontera']
    requests_mock.get(settings.SYSTEM_MONITOR_URL, exc=Http404)
    response = client.get('/api/system-monitor/')
    assert response.status_code == 404
