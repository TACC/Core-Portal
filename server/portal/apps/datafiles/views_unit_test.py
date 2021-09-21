import pytest
import json
import logging
from mock import MagicMock
from requests.exceptions import HTTPError
from portal.apps.datafiles.models import Link
from portal.apps.notifications.models import Notification

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
        'hosts': {}
    }

    mock_agave_client.systems.get.return_value = {
        'storage': {
            'host': 'frontera.tacc.utexas.edu'
        }
    }

    response = client.get('/api/datafiles/tapis/listing/private/frontera.home.username/')
    assert response.status_code == 403


def test_ignore_missing_corral(client, authenticated_user, mocker, monkeypatch, mock_agave_client):
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
        'hosts': {}
    }

    mock_agave_client.systems.get.return_value = {
        'storage': {
            'host': 'data.tacc.utexas.edu'
        }
    }

    response = client.get('/api/datafiles/tapis/listing/private/corral.home.username/')
    assert response.status_code == 502


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
        'hosts': {'frontera.tacc.utexas.edu': []}
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


def test_get_link(client, authenticated_user):
    link = Link(
        agave_uri="system/path",
        postit_url="https://postit"
    )
    link.save()
    response = client.get("/api/datafiles/link/tapis/system/path")
    result = json.loads(response.content)
    assert result['data'] == "https://postit"


def test_link_not_found(client, authenticated_user):
    response = client.get("/api/datafiles/link/tapis/system/notfound")
    result = json.loads(response.content)
    assert result['data'] is None


def test_link_post(postits_create, authenticated_user, client):
    result = client.post("/api/datafiles/link/tapis/system/path")
    assert json.loads(result.content)["data"] == "https://tenant/uuid"
    assert Link.objects.all()[0].get_uuid() == "uuid"
    postits_create.assert_called_with(
       body={
            "url": "https://api.example.com/files/v2/media/system/system/path",
            "unlimited": True
        }
    )


def test_link_delete(postits_create, authenticated_user, mock_agave_client, client):
    mock_agave_client.postits.delete.return_value = "OK"
    client.post("/api/datafiles/link/tapis/system/path")
    result = client.delete("/api/datafiles/link/tapis/system/path")
    assert json.loads(result.content)["data"] == "OK"
    assert result.status_code == 200
    assert len(Link.objects.all()) == 0


def test_link_put(postits_create, authenticated_user, mock_agave_client, client):
    mock_agave_client.postits.delete.return_value = "OK"
    link = Link.objects.create(
        agave_uri="system/path",
        postit_url="https://tenant/olduuid"
    )
    link.save()
    result = client.put("/api/datafiles/link/tapis/system/path")
    assert json.loads(result.content)["data"] == "https://tenant/uuid"
    assert Link.objects.all()[0].get_uuid() == "uuid"


def test_generate_notification_on_request(client, authenticated_user, mock_agave_client, agave_indexer):
    mock_response = {'nativeFormat': 'dir'}
    mock_agave_client.files.manage.return_value = mock_response

    response = client.put("/api/datafiles/tapis/move/private/frontera.home.username/test.txt/",
                          content_type="application/json",
                          data={"dest_path": "/testfol",
                                "dest_system": "frontera.home.username"})
    assert response.json() == {'data': mock_response}
    n = Notification.objects.last()
    extra_from_notification = n.to_dict()['extra']
    assert extra_from_notification == {'response': mock_response}


def test_get_system(client, authenticated_user, mock_agave_client, agave_storage_system_mock):
    mock_agave_client.systems.get.return_value = agave_storage_system_mock

    response = client.get("/api/datafiles/systems/definition/MySystem/")
    assert response.status_code == 200
    assert response.json() == agave_storage_system_mock


def test_get_system_forbidden(client, regular_user, mock_agave_client, agave_storage_system_mock):
    mock_agave_client.systems.get.return_value = agave_storage_system_mock

    response = client.get("/api/datafiles/systems/definition/MySystem/")
    assert response.status_code == 302 # redirect to login


@pytest.fixture
def logging_metric_mock(mocker):
    logger = logging.getLogger('metrics.{}'.format("portal.apps.datafiles.views"))
    yield mocker.patch.object(logger, 'info')


def test_tapis_file_view_get_is_logged_for_metrics(client, authenticated_user, mock_agave_client,
                                                   agave_file_listing_mock, agave_listing_indexer, logging_metric_mock):
    mock_agave_client.files.list.return_value = agave_file_listing_mock
    response = client.get("/api/datafiles/tapis/listing/private/frontera.home.username/test.txt/?length=1234")
    assert response.status_code == 200
    assert response.json() == {"data": {"listing": agave_file_listing_mock, "reachedEnd": True}}

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_called_with(
        "user:{} op:listing api:tapis scheme:private system:frontera.home.username path:test.txt filesize:1234".format(
            authenticated_user.username))


def test_tapis_file_view_put_is_logged_for_metrics(client, authenticated_user, mock_agave_client,
                                                   agave_indexer, logging_metric_mock):
    mock_response = {'nativeFormat': 'dir'}
    mock_agave_client.files.manage.return_value = mock_response
    body = {"dest_path": "/testfol", "dest_system": "frontera.home.username"}
    response = client.put("/api/datafiles/tapis/move/private/frontera.home.username/test.txt/",
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_called_with(
        "user:{} op:move api:tapis scheme:private "
        "system:frontera.home.username path:test.txt body:{}".format(authenticated_user.username, body))


def test_tapis_file_view_post_is_logged_for_metrics(client, authenticated_user, mock_agave_client,
                                                    agave_indexer, agave_listing_indexer, logging_metric_mock,
                                                    agave_file_mock, text_file_fixture):
    mock_agave_client.files.importData.return_value = agave_file_mock
    response = client.post("/api/datafiles/tapis/upload/private/frontera.home.username/",
                          data={"uploaded_file": text_file_fixture})
    assert response.status_code == 200
    assert response.json() == {"data": agave_file_mock}

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_called_with(
        "user:{} op:upload api:tapis scheme:private "
        "system:frontera.home.username path:/ filename:text_file.txt".format(authenticated_user.username))


POSTIT_HREF = "https://tapis.example/postit/something"


@pytest.mark.parametrize("EXTENSION,TYPE", [("PNG", "image", ), ("JPG", "image"), ("jpeg", "image"),
                                            ("doc", "ms-office"), ("docx", "ms-office"),
                                            ("pdf", "object")])
def test_tapis_file_view_preview_supported_non_text_files(client, authenticated_user, mock_agave_client,
                                                          agave_file_listing_mock, agave_indexer, EXTENSION, TYPE):
    mock_agave_client.files.list.return_value = agave_file_listing_mock
    mock_agave_client.postits.create.return_value = {"_links": {"self": {"href": POSTIT_HREF}}}
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/test_text.{}/".format(EXTENSION),
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})

    href = POSTIT_HREF if TYPE != "ms-office" \
        else "https://view.officeapps.live.com/op/view.aspx?src={}".format(POSTIT_HREF)

    assert response.status_code == 200
    assert response.json() == {"data": {"href": href, "fileType": TYPE}}


def test_tapis_file_view_preview_text_file(client, authenticated_user, mock_agave_client, agave_file_listing_mock,
                                           requests_mock, agave_indexer):
    mock_agave_client.files.list.return_value = agave_file_listing_mock
    mock_agave_client.postits.create.return_value = {"_links": {"self": {"href": POSTIT_HREF}}}
    requests_mock.get(POSTIT_HREF, text="file content")
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/test_text.txt/",
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})
    assert response.status_code == 200
    assert response.json() == {"data": {"href": POSTIT_HREF, "fileType": "text", "content": "file content", "error": None}}


def test_tapis_file_view_preview_other_text_file(client, authenticated_user, mock_agave_client, agave_file_listing_mock,
                                           requests_mock, agave_indexer):
    mock_agave_client.files.list.return_value = agave_file_listing_mock
    mock_agave_client.postits.create.return_value = {"_links": {"self": {"href": POSTIT_HREF}}}
    requests_mock.get(POSTIT_HREF, text="file content")
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/some_other_txt_file_like_log.applog/",
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})
    assert response.status_code == 200
    assert response.json() == {"data": {"href": POSTIT_HREF, "fileType": "other", "content": "file content", "error": None}}
