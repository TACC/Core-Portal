import json
import os

import pytest
from django.conf import settings
from django.http import Http404


@pytest.fixture
def system_status(scope="module"):
    with open(os.path.join(settings.BASE_DIR, "fixtures/system_monitor/index.json")) as f:
        yield json.load(f)


@pytest.fixture
def system_status_missing_frontera(scope="module"):
    with open(os.path.join(settings.BASE_DIR, "fixtures/system_monitor/index_missing_frontera.json")) as f:
        yield json.load(f)


@pytest.mark.django_db()
def test_system_monitor_get(client, settings, requests_mock, system_status):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ["Frontera"]
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status)
    response = client.get("/api/system-monitor/")
    assert response.status_code == 200
    system = response.json()[0]
    assert system["display_name"] == "Frontera"
    assert system["hostname"] == "frontera.tacc.utexas.edu"
    assert system["load_percentage"] == 97
    assert system["jobs"] == {"running": 365, "queued": 247}
    assert system["is_operational"]


@pytest.mark.django_db()
def test_system_monitor_when_missing_system(client, settings, requests_mock, system_status_missing_frontera):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ["Frontera"]
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status_missing_frontera)
    response = client.get("/api/system-monitor/")
    assert response.status_code == 200
    system = response.json()[0]
    assert system["hostname"] == "frontera.tacc.utexas.edu"
    assert system["display_name"] == "Frontera"
    assert not system["is_operational"]
    assert system["jobs"] == {"running": 0, "queued": 0}
    assert system["load_percentage"] == 0


@pytest.mark.django_db()
def test_system_monitor_when_display_list_is_empty(client, settings, requests_mock, system_status):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = []
    requests_mock.get(settings.SYSTEM_MONITOR_URL, json=system_status)
    response = client.get("/api/system-monitor/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.django_db()
def test_system_monitor_when_status_endpoint_fails(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ["Frontera"]
    requests_mock.get(settings.SYSTEM_MONITOR_URL, exc=Http404)
    response = client.get("/api/system-monitor/")
    assert response.status_code == 404


@pytest.mark.parametrize("load", [None, "0.95", True, float("nan"), float("inf"), -float("inf")])
def test_queue_load_validation(load):
    from portal.apps.system_monitor.views import _get_queues

    assert _get_queues({"queues": {"normal": {"load": load}}}) == [{"name": "normal", "load": None}]


@pytest.mark.parametrize("load", [0, 0.8999, 0.9, 1])
def test_queue_load_numbers(load):
    from portal.apps.system_monitor.views import _get_queues

    assert _get_queues({"queues": {"normal": {"load": load}}}) == [{"name": "normal", "load": load}]


@pytest.mark.parametrize("queues", [None, [], "unavailable", {"normal": None}])
def test_unavailable_queues(queues):
    from portal.apps.system_monitor.views import _get_queues

    assert _get_queues({"queues": queues}) == []


@pytest.mark.django_db()
def test_system_queue_load_validation(client, settings, requests_mock):
    settings.SYSTEM_MONITOR_DISPLAY_LIST = ["Frontera"]
    requests_mock.get(
        f"{settings.SYSTEM_MONITOR_URL}frontera.tacc.utexas.edu",
        json={"display_name": "Frontera", "queues": {"normal": {"load": "0.95"}, "large": {"load": 0.9}}},
    )
    response = client.get("/api/system-monitor/frontera.tacc.utexas.edu")
    assert response.status_code == 200
    assert response.json() == [{"name": "normal", "load": None}, {"name": "large", "load": 0.9}]
