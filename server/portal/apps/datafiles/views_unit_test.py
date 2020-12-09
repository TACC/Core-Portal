from mock import MagicMock
from requests.exceptions import HTTPError
from portal.apps.datafiles.models import PublicUrl
import pytest
import json


pytestmark = pytest.mark.django_db


@pytest.fixture
def postits_create(mock_agave_client):
    mock_agave_client.postits.create.return_value = {
        '_links': {
            'self': {
                'href': "https://tenant/uuid"
            }
        }   
    }
    yield mock_agave_client.postits.create


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


def test_get_public_url(client):
    public_url = PublicUrl(
        agave_uri="system/path",
        postit_url="https://postit"
    )
    public_url.save()
    response = client.get("/api/datafiles/publicurl/tapis/system/path")
    result = json.loads(response.content)
    assert result['data'] == "https://postit"


def test_public_url_not_found(client):
    response = client.get("/api/datafiles/publicurl/tapis/system/notfound")
    result = json.loads(response.content)
    assert result['data'] is None


def test_public_url_post(postits_create, authenticated_user, client):
    result = client.post("/api/datafiles/publicurl/tapis/system/path")
    assert json.loads(result.content)["data"] == "https://tenant/uuid"
    assert PublicUrl.objects.all()[0].get_uuid() == "uuid"
    postits_create.assert_called_with(
       body={
            "url": "https://api.example.com/files/v2/media/system/system/path",
            "unlimited": True
        }
    )


def test_public_url_delete(postits_create, authenticated_user, mock_agave_client, client):
    mock_agave_client.postits.delete.return_value = "OK"
    client.post("/api/datafiles/publicurl/tapis/system/path")
    result = client.delete("/api/datafiles/publicurl/tapis/system/path")
    assert json.loads(result.content)["data"] == "OK"
    assert result.status_code == 200
    assert len(PublicUrl.objects.all()) == 0


def test_public_url_post_existing(postits_create, authenticated_user, mock_agave_client, client):
    mock_agave_client.postits.delete.return_value = "OK"
    public_url = PublicUrl.objects.create(
        agave_uri="system/path",
        postit_url="https://tenant/olduuid"
    )
    public_url.save()
    result = client.post("/api/datafiles/publicurl/tapis/system/path")
    assert json.loads(result.content)["data"] == "https://tenant/uuid"
    assert PublicUrl.objects.all()[0].get_uuid() == "uuid"
