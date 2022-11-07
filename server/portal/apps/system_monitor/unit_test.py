import pytest
import json
import os
from django.conf import settings
from django.http import Http404


@pytest.fixture
def system_status_old(scope="module"):
    yield json.load(open(os.path.join(settings.BASE_DIR, 'fixtures/system_monitor/index.json')))


@pytest.fixture
def system_status(system_status_old, scope="module"):
    sys_status = system_status_old.copy()
    yield sys_status


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
    assert system['display_name'] == 'Frontera'
    assert system['hostname'] == 'frontera.tacc.utexas.edu'
    assert system['load'] == 97
    assert system['running'] == 365
    assert system['waiting'] == 247
    assert system['is_operational']


@pytest.mark.django_db()
def test_system_monitor_when_missing_system(client, settings, requests_mock, system_status_missing_frontera):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ['Frontera']
    requests_mock.get(settings.SYSTEM_MONITOR_URL,  json=system_status_missing_frontera)
    response = client.get('/api/system-monitor/')
    assert response.status_code == 200
    system = response.json()[0]
    assert system['display_name'] == 'Frontera'
    assert not system['is_operational']
    assert system['load'] == 0
    assert system['running'] == 0
    assert system['waiting'] == 0


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
