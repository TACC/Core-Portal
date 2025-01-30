import json
import logging
import os

import pytest
from django.conf import settings
from mock import MagicMock, patch
from tapipy.errors import InternalServerError
from tapipy.tapis import TapisResult

from portal.apps.datafiles.models import Link
pytestmark = pytest.mark.django_db


@pytest.fixture
def postits_create(mock_tapis_client):

    mock_tapis_client.files.createPostIt.return_value = TapisResult(
        redeemUrl="https://tenant/uuid",
        expiration=None
    )
    yield mock_tapis_client.files.createPostIt


@pytest.fixture
def get_user_data(mocker):
    mock = mocker.patch('portal.apps.datafiles.views.get_user_data')
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_user.json')) as f:
        tas_user = json.load(f)
    mock.return_value = tas_user
    yield mock


def test_get_no_allocation(client, authenticated_user, mocker, monkeypatch, mock_tapis_client):
    mock_tapis_get = mocker.patch('portal.apps.datafiles.views.tapis_get_handler')
    mock_error = InternalServerError()
    monkeypatch.setattr(
        mock_error, 'response', MagicMock(
            json=MagicMock(return_value={}),
            status_code=500
        )
    )
    mock_tapis_get.side_effect = mock_error

    mock_get_allocations = mocker.patch('portal.apps.datafiles.views.get_allocations')
    mock_get_allocations.return_value = {
        'hosts': {}
    }

    mock_tapis_client.systems.getSystem.return_value = TapisResult(host='frontera.tacc.utexas.edu')

    response = client.get('/api/datafiles/tapis/listing/private/frontera.home.username/')
    assert response.status_code == 403


def test_ignore_missing_corral(client, authenticated_user, mocker, monkeypatch, mock_tapis_client):
    mock_tapis_get = mocker.patch('portal.apps.datafiles.views.tapis_get_handler')
    mock_error = InternalServerError()
    monkeypatch.setattr(
        mock_error, 'response', MagicMock(
            json=MagicMock(return_value={}),
            status_code=500
        )
    )
    mock_tapis_get.side_effect = mock_error

    mock_get_allocations = mocker.patch('portal.apps.datafiles.views.get_allocations')
    mock_get_allocations.return_value = {
        'hosts': {}
    }

    mock_tapis_client.systems.getSystem.return_value = TapisResult(host='data.tacc.utexas.edu')

    response = client.get('/api/datafiles/tapis/listing/private/corral.home.username/')
    assert response.status_code == 500


def test_get_requires_push_keys(client, authenticated_user, mocker, monkeypatch, mock_tapis_client):
    mock_tapis_get = mocker.patch('portal.apps.datafiles.views.tapis_get_handler')
    mock_error = InternalServerError()
    monkeypatch.setattr(
        mock_error, 'response', MagicMock(
            json=MagicMock(return_value={}),
            status_code=500
        )
    )
    mock_tapis_get.side_effect = mock_error

    mock_get_allocations = mocker.patch('portal.apps.datafiles.views.get_allocations')
    mock_get_allocations.return_value = {
        'hosts': {'frontera.tacc.utexas.edu': []}
    }

    system = {
        'host': 'frontera.tacc.utexas.edu'
    }

    mock_tapis_client.systems.getSystem.return_value = TapisResult(**system)

    response = client.get('/api/datafiles/tapis/listing/private/frontera.home.username/')
    assert response.status_code == 500
    assert response.json() == {'system': system}


def test_get_link(client, authenticated_user):
    Link.objects.create(
        tapis_uri="system/path",
        postit_url="https://postit"
    )
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
       systemId="system",
       path="path",
       allowedUses=-1,
       validSeconds=31536000
    )


def test_link_post_already_exists(postits_create, authenticated_user, client):
    result = client.post("/api/datafiles/link/tapis/system/path")
    assert json.loads(result.content)["data"] == "https://tenant/uuid"
    assert Link.objects.all()[0].get_uuid() == "uuid"
    postits_create.assert_called_with(
       systemId="system",
       path="path",
       allowedUses=-1,
       validSeconds=31536000
    )
    result = client.post("/api/datafiles/link/tapis/system/path")
    assert result.status_code == 400
    assert result.json() == {"message": "Link for this file already exists"}


def test_link_delete(postits_create, authenticated_user, mock_tapis_client, client):
    mock_tapis_client.files.deletePostIt.return_value = "OK"
    client.post("/api/datafiles/link/tapis/system/path")
    result = client.delete("/api/datafiles/link/tapis/system/path")
    assert json.loads(result.content)["data"] == "OK"
    assert result.status_code == 200
    assert len(Link.objects.all()) == 0


def test_link_delete_dne(authenticated_user, mock_tapis_client, client):
    mock_tapis_client.files.deletePostIt.return_value = "Bad Request"
    result = client.delete("/api/datafiles/link/tapis/system/path")
    assert result.status_code == 400
    assert result.json() == {"message": "Post-it does not exist"}


def test_link_put(postits_create, authenticated_user, mock_tapis_client, client):
    mock_tapis_client.files.deletePostIt.return_value = "OK"
    Link.objects.create(
        tapis_uri="system/path",
        postit_url="https://tenant/olduuid"
    )
    result = client.put("/api/datafiles/link/tapis/system/path")
    assert json.loads(result.content)["data"] == "https://tenant/uuid"
    assert Link.objects.all()[0].get_uuid() == "uuid"


def test_link_put_dne(postits_create, authenticated_user, mock_tapis_client, client):
    mock_tapis_client.files.deletePostIt.return_value = "Bad Request"
    result = client.put("/api/datafiles/link/tapis/system/path")
    assert result.status_code == 400
    assert result.json() == {"message": "Could not find pre-existing link"}


def test_get_system(client, authenticated_user, mock_tapis_client, agave_storage_system_mock):
    mock_tapis_client.systems.getSystem.return_value = TapisResult(**agave_storage_system_mock)

    response = client.get("/api/datafiles/systems/definition/MySystem/")
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": agave_storage_system_mock}


def test_get_system_forbidden(client, regular_user, mock_tapis_client, agave_storage_system_mock):
    mock_tapis_client.systems.get.return_value = agave_storage_system_mock

    response = client.get("/api/datafiles/systems/definition/MySystem/")
    assert response.status_code == 401


@pytest.fixture
def logging_metric_mock(mocker):
    logger = logging.getLogger('metrics.{}'.format("portal.apps.datafiles.views"))
    yield mocker.patch.object(logger, 'info')


@patch('portal.libs.agave.operations.tapis_listing_indexer')
def test_tapis_file_view_get_is_logged_for_metrics(mock_indexer, client, authenticated_user, mock_tapis_client,
                                                   tapis_file_listing_mock, logging_metric_mock):
    tapis_listing_result = [TapisResult(**f) for f in tapis_file_listing_mock]
    mock_tapis_client.files.listFiles.return_value = tapis_listing_result
    response = client.get("/api/datafiles/tapis/listing/private/frontera.home.username/test.txt/?length=1234")
    assert response.status_code == 200
    assert response.json() == {
        "data": {
            "listing": [
                {
                    'system': 'frontera.home.username',
                    'type': 'dir' if f.type == 'dir' else 'file',
                    'format': 'folder' if f.type == 'dir' else 'raw',
                    'mimeType': f.mimeType,
                    'path': f.path,
                    'name': f.name,
                    'length': f.size,
                    'lastModified': f.lastModified,
                    '_links': {
                        'self': {'href': f.url}
                    }
                } for f in tapis_listing_result
            ],
            "reachedEnd": True
        }
    }

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_any_call()


@patch('portal.libs.agave.operations.tapis_indexer')
@patch(
    "django.conf.settings.PORTAL_DATAFILES_STORAGE_SYSTEMS",
    [{"scheme": "public", "system": "public.system", "homeDir": "/public/home/"}],
)
def test_tapis_file_view_get_unauthorized(
    mock_indexer,
    client,
):
    mock_user = MagicMock()
    mock_user.tapis_oauth = 0

    with patch('django.contrib.auth.get_user', return_value=mock_user):
        response = client.get("/api/datafiles/tapis/listing/private/frontera.home.username/test.txt/?length=1234")
        assert response.status_code == 403
        assert response.json() == {'message': 'This data requires authentication to view.'}


@patch('portal.libs.agave.operations.tapis_indexer')
def test_tapis_file_view_put_is_logged_for_metrics(mock_indexer, client, authenticated_user, mock_tapis_client,
                                                   tapis_file_listing_mock, logging_metric_mock):
    mock_response = {'status': 'success'}
    mock_tapis_client.files.moveCopy.return_value = mock_response
    body = {"dest_path": "/testfol", "dest_system": "frontera.home.username"}
    response = client.put("/api/datafiles/tapis/move/private/frontera.home.username/test.txt/",
                          content_type="application/json",
                          data=body)
    assert response.status_code == 200

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_any_call()


@patch('portal.libs.agave.operations.tapis_indexer')
@patch('portal.apps.datafiles.views.tapis_put_handler')
def test_tapis_file_view_put_is_logged_for_metrics_exception(mock_put_handler, mock_indexer, client, authenticated_user, mock_tapis_client):
    mock_put_handler.side_effect = Exception("Exception in Metrics info or Tapis Put Handler views.py:142")
    body = {"dest_path": "/testfol", "dest_system": "frontera.home.username"}
    response = client.put("/api/datafiles/tapis/move/private/frontera.home.username/test.txt/",
                          content_type="application/json",
                          data=body)
    assert response.status_code == 500


@patch('portal.libs.agave.operations.tapis_indexer')
def test_tapis_file_view_put_is_unauthorized(mock_indexer, client):
    mock_user = MagicMock()
    mock_user.tapis_oauth = 0
    with patch('django.contrib.auth.get_user', return_value=mock_user):
        body = {"dest_path": "/testfol", "dest_system": "frontera.home.username"}
        response = client.put(
            "/api/datafiles/tapis/move/private/frontera.home.username/test.txt/",
            content_type="application/json",
            data=body,
        )
        assert response.status_code == 403
        assert response.content == b"This data requires authentication to view."


@patch('portal.libs.agave.operations.tapis_indexer')
def test_tapis_file_view_post_is_logged_for_metrics(mock_indexer, client, authenticated_user, mock_tapis_client,
                                                    logging_metric_mock,
                                                    tapis_file_mock, requests_mock, text_file_fixture):

    mock_tapis_client.files.insert.return_value = tapis_file_mock

    response = client.post("/api/datafiles/tapis/upload/private/frontera.home.username/",
                           data={"uploaded_file": text_file_fixture})

    assert response.status_code == 200
    assert response.json() == {"data": tapis_file_mock}

    # Ensure metric-related logging is being performed
    logging_metric_mock.assert_any_call()


@patch('portal.libs.agave.operations.tapis_indexer')
def test_tapis_file_view_post_is_unauthorized(mock_indexer, text_file_fixture, client):
    mock_user = MagicMock()
    mock_user.tapis_oauth = 0
    with patch('django.contrib.auth.get_user', return_value=mock_user):
        response = client.post("/api/datafiles/tapis/upload/private/frontera.home.username/", data={"uploaded_file": text_file_fixture})
        assert response.status_code == 403
        assert response.content == b"This data requires authentication to upload."


@patch('portal.libs.agave.operations.tapis_indexer')
@patch('portal.apps.datafiles.views.tapis_post_handler')
def test_tapis_file_view_post_is_logged_for_metrics_exception(mock_post_handler, mock_indexer, client, authenticated_user, mock_tapis_client,
                                                              logging_metric_mock, tapis_file_mock, requests_mock, text_file_fixture):
    mock_post_handler.side_effect = Exception("Exception in Metrics info or Tapis Put Handler views.py:175")
    mock_tapis_client.files.insert.return_value = tapis_file_mock

    response = client.post("/api/datafiles/tapis/upload/private/frontera.home.username/",
                           data={"uploaded_file": text_file_fixture})

    assert response.status_code == 500


POSTIT_HREF = "https://tapis.example/postit/something"


@pytest.mark.parametrize("EXTENSION,TYPE", [("PNG", "image", ), ("JPG", "image"), ("jpeg", "image"),
                                            ("doc", "ms-office"), ("docx", "ms-office"),
                                            ("pdf", "object")])
def test_tapis_file_view_preview_supported_non_text_files(client, authenticated_user, mock_tapis_client,
                                                          agave_file_listing_mock, EXTENSION, TYPE):
    mock_tapis_client.files.listFiles.return_value = [TapisResult(**f) for f in agave_file_listing_mock]
    mock_tapis_client.files.createPostIt.return_value = TapisResult(
        redeemUrl=POSTIT_HREF,
        expiration=None
    )
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/test_text.{}/".format(EXTENSION),
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})

    href = POSTIT_HREF if TYPE != "ms-office" \
        else "https://view.officeapps.live.com/op/view.aspx?src={}".format(POSTIT_HREF)

    assert response.status_code == 200
    assert response.json() == {"data": {"href": href, "fileType": TYPE, 'content': None, 'error': None}}


def test_tapis_file_view_preview_text_file(client, authenticated_user, mock_tapis_client, agave_file_listing_mock,
                                           requests_mock):
    mock_tapis_client.files.listFiles.return_value = [TapisResult(**f) for f in agave_file_listing_mock]
    mock_tapis_client.files.createPostIt.return_value = TapisResult(
        redeemUrl=POSTIT_HREF,
        expiration=None
    )
    requests_mock.get(POSTIT_HREF, text="file content")
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/test_text.txt/",
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})
    assert response.status_code == 200
    assert response.json() == {"data": {"href": POSTIT_HREF, "fileType": "text", "content": "file content", "error": None}}


def test_tapis_file_view_preview_other_text_file(client, authenticated_user, mock_tapis_client, agave_file_listing_mock,
                                                 requests_mock):
    mock_tapis_client.files.listFiles.return_value = [TapisResult(**f) for f in agave_file_listing_mock]
    mock_tapis_client.files.createPostIt.return_value = TapisResult(
        redeemUrl=POSTIT_HREF,
        expiration=None
    )
    requests_mock.get(POSTIT_HREF, text="file content")
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/some_other_txt_file_like_log.applog/",
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})
    assert response.status_code == 200
    assert response.json() == {"data": {"href": POSTIT_HREF, "fileType": "other", "content": "file content", "error": None}}


def test_tapis_file_view_preview_unsupported_file(client, authenticated_user, mock_tapis_client, agave_file_listing_mock,
                                                  requests_mock):
    mock_tapis_client.files.listFiles.return_value = [TapisResult(**f) for f in agave_file_listing_mock]
    mock_tapis_client.files.createPostIt.return_value = TapisResult(
        redeemUrl=POSTIT_HREF,
        expiration=None
    )
    requests_mock.get(POSTIT_HREF, text="file content")
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/test.html/",
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})
    assert response.status_code == 200
    assert response.json() == {"data": {"href": POSTIT_HREF, "fileType": None, "content": None, "error": "This file type must be previewed in a new window."}}


def test_tapis_file_view_preview_large_file(client, authenticated_user, mock_tapis_client, agave_file_listing_mock,
                                            requests_mock):
    agave_file_listing_mock[0]["size"] = 5000000
    mock_tapis_client.files.listFiles.return_value = [TapisResult(**f) for f in agave_file_listing_mock]
    mock_tapis_client.files.createPostIt.return_value = TapisResult(
        redeemUrl=POSTIT_HREF,
        expiration=None
    )
    requests_mock.get(POSTIT_HREF, text="file content")
    response = client.put("/api/datafiles/tapis/preview/private/frontera.home.username/test.log/",
                          content_type="application/json",
                          data={"href": "https//tapis.example/href"})
    assert response.status_code == 200
    assert response.json() == {"data": {"href": POSTIT_HREF, "fileType": 'other', "content": None, "error": "File too large to preview in this window."}}


def test_systems_list(client, authenticated_user, mock_tapis_client, agave_storage_system_mock, get_user_data):
    mock_tapis_client.systems.getSystem.return_value = TapisResult(**agave_storage_system_mock)

    response = client.get('/api/datafiles/systems/list/')
    assert response.json() == {
        "default_host": "cloud.data.tacc.utexas.edu",
        "default_system": "cloud.data",
        "system_list": [
            {
                'name': 'My Data (Work)',
                'system': 'cloud.data',
                'scheme': 'private',
                'api': 'tapis',
                'homeDir': '/home/username',
                'icon': None,
                'default': True
            },
            {
                'name': 'My Data (Frontera)',
                'system': 'frontera',
                'scheme': 'private',
                'api': 'tapis',
                'homeDir': '/home1/01234/username',
                'icon': None,
            },
            {
                'name': 'Community Data',
                'system': 'cloud.data',
                'scheme': 'community',
                'api': 'tapis',
                'homeDir': '/path/to/community',
                'icon': None,
                'siteSearchPriority': 1
            },
            {
                'name': 'Public Data',
                'system': 'cloud.data',
                'scheme': 'public',
                'api': 'tapis',
                'homeDir': '/path/to/public',
                'icon': 'publications',
                'siteSearchPriority': 0
            },
            {
                'name': 'Shared Workspaces',
                'scheme': 'projects',
                'api': 'tapis',
                'icon': 'publications'
            },
            {
                'name': 'Google Drive',
                'system': 'googledrive',
                'scheme': 'private',
                'api': 'googledrive',
                'icon': None,
                'integration': 'portal.apps.googledrive_integration'
            }
        ]
    }
