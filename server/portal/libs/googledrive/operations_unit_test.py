import pytest
import io
from mock import MagicMock


@pytest.fixture
def mock_uploader(mocker):
    from googleapiclient.http import MediaIoBaseUpload
    patched = mocker.patch(
        'portal.libs.googledrive.operations.MediaIoBaseUpload')

    patched.return_value = MagicMock(spec=MediaIoBaseUpload)
    yield patched


@pytest.fixture
def mock_downloader(mocker):
    from googleapiclient.http import MediaIoBaseDownload
    patched = mocker.patch(
        'portal.libs.googledrive.operations.MediaIoBaseDownload')

    patched.return_value = MagicMock(spec=MediaIoBaseDownload)
    yield patched


@pytest.fixture
def mock_googledrive_listing():
    def side_effect(key):
        if key == 'files':
            return [{'mimeType': 'application/vnd.google-apps.folder',
                     'id': '1234',
                     'name': 'mockfile',
                     'modifiedTime': 'mocktime',
                     'webViewLink': 'http://webviewlink'}]
        if key == 'nextPageToken':
            return None

    mock_listing = MagicMock()
    mock_listing.get.side_effect = side_effect
    yield mock_listing


@pytest.fixture
def mock_listing_operation(mocker):
    res1 = {'listing': [{
            'system': 'googledrive',
            'type': 'dir',
            'format': 'folder',
            'mimeType': 'application/vnd.google-apps.folder',
            'path': '1234',
            'name': 'mockdir',
            'length': 0,
            'lastModified': 'mocktime',
            '_links': {
                'self': {'href': 'http://webviewlink'}
            }}],
            'nextPageToken': None,
            'reachedEnd': True
            }

    res2 = {'listing': [{
            'system': 'googledrive',
            'type': 'file',
            'format': 'file',
            'mimeType': 'text/plain',
            'path': '1234',
            'name': 'mockfile',
            'length': 0,
            'lastModified': 'mocktime',
            '_links': {
                'self': {'href': 'http://webviewlink'}
            }}],
            'nextPageToken': None,
            'reachedEnd': True
            }

    mock_listing = mocker.patch('portal.libs.googledrive.operations.listing')
    mock_listing.side_effect = [res1, res2]


def test_googledrive_listing(mock_googledrive_client,
                             mock_googledrive_listing):
    from portal.libs.googledrive.operations import listing

    mock_googledrive_client.files().list().execute.return_value = \
        mock_googledrive_listing

    test_listing = listing(mock_googledrive_client, 'googledrive', 'abcd',
                           nextPageToken=None)

    expected_result = {
        'listing': [{
            'system': 'googledrive',
            'type': 'dir',
            'format': 'folder',
            'mimeType': 'application/vnd.google-apps.folder',
            'path': '1234',
            'name': 'mockfile',
            'length': 0,
            'lastModified': 'mocktime',
            '_links': {
                'self': {'href': 'http://webviewlink'}
            }}],
        'nextPageToken': None,
        'reachedEnd': True
    }

    mock_googledrive_client.files().list.assert_called_with(
        q="'abcd' in parents and trashed=False",
        fields="files(mimeType, name, id, modifiedTime, fileExtension, size, parents, webViewLink), nextPageToken",
        pageSize=100,
        pageToken=None
    )

    assert test_listing == expected_result


def test_googledrive_search(mock_googledrive_client,
                            mock_googledrive_listing):
    from portal.libs.googledrive.operations import search

    mock_googledrive_client.files().list().execute.return_value = \
        mock_googledrive_listing

    test_listing = search(mock_googledrive_client, 'googledrive', 'abcd',
                          nextPageToken=None, query_string='testquery')

    expected_result = {
        'listing': [{
            'system': 'googledrive',
            'type': 'dir',
            'format': 'folder',
            'mimeType': 'application/vnd.google-apps.folder',
            'path': '1234',
            'name': 'mockfile',
            'length': 0,
            'lastModified': 'mocktime',
            '_links': {
                'self': {'href': 'http://webviewlink'}
            }}],
        'nextPageToken': None,
        'reachedEnd': True
    }

    mock_googledrive_client.files().list.assert_called_with(
        q="'abcd' in parents and trashed=False and name contains 'testquery'",
        fields="files(mimeType, name, id, modifiedTime, fileExtension, size, parents, webViewLink), nextPageToken",
        pageSize=100,
        pageToken=None
    )

    assert test_listing == expected_result


def test_upload(mock_googledrive_client, mock_uploader):
    from portal.libs.googledrive.operations import upload
    testfile = io.StringIO('Test File Content')
    testfile.name = "testfile"

    upload(mock_googledrive_client, 'googledrive', 'testpath', testfile)

    mock_uploader.assert_called_with(testfile, mimetype='text/plain')
    mock_googledrive_client.files().create.assert_called_with(
        body={'name': 'testfile',
              'parents': ['testpath']},
        media_body=mock_uploader())


def test_mkdir(mock_googledrive_client):
    from portal.libs.googledrive.operations import mkdir
    mkdir(mock_googledrive_client, 'googledrive', 'testid', 'testdir')
    mock_googledrive_client.files().create.assert_called_with(
        body={
            'name': 'testdir',
            'parents': ['testid'],
            'mimeType': 'application/vnd.google-apps.folder'
        },
        fields='mimeType, name, id, modifiedTime, fileExtension, size, parents'
    )


def test_download(mock_googledrive_client, mock_downloader):
    from portal.libs.googledrive.operations import download
    mock_downloader().next_chunk.return_value = ('done', True)
    mock_googledrive_client.files().get().execute.return_value = {'name':
                                                                  'testfile'}
    downloaded = download(mock_googledrive_client, 'googledrive', 'testid')

    assert downloaded.name == 'testfile'


def test_copy_file(mock_googledrive_client, mocker):
    from portal.libs.googledrive.operations import copy
    mock_transfer = mocker.patch('portal.libs.transfer.operations.transfer')
    copy(mock_googledrive_client, 'googledrive', 'src_id', 'googledrive',
         'dest_id', 'testfile', filetype='file')

    mock_transfer.assert_called_with(mock_googledrive_client,
                                     mock_googledrive_client,
                                     'googledrive',
                                     'googledrive',
                                     'googledrive',
                                     'googledrive',
                                     'src_id',
                                     'dest_id')


def test_copy_dir(mock_googledrive_client, mocker):
    from portal.libs.googledrive.operations import copy
    mock_transfer = mocker.patch(
        'portal.libs.transfer.operations.transfer_folder')
    copy(mock_googledrive_client, 'googledrive', 'src_id', 'googledrive',
         'dest_id', 'testfile', filetype='dir')

    mock_transfer.assert_called_with(mock_googledrive_client,
                                     mock_googledrive_client,
                                     'googledrive',
                                     'googledrive',
                                     'googledrive',
                                     'googledrive',
                                     'src_id',
                                     'dest_id',
                                     'testfile')


def test_walk(mock_googledrive_client, mock_listing_operation):
    from portal.libs.googledrive.operations import walk_all
    res1 = {
            'system': 'googledrive',
            'type': 'dir',
            'format': 'folder',
            'mimeType': 'application/vnd.google-apps.folder',
            'path': '1234',
            'name': 'mockdir',
            'length': 0,
            'lastModified': 'mocktime',
            '_links': {
                'self': {'href': 'http://webviewlink'}
            }}

    res2 = {
            'system': 'googledrive',
            'type': 'file',
            'format': 'file',
            'mimeType': 'text/plain',
            'path': '1234',
            'name': 'mockfile',
            'length': 0,
            'lastModified': 'mocktime',
            '_links': {
                'self': {'href': 'http://webviewlink'}
            }}

    walk_res = walk_all(mock_googledrive_client, 'googledrive', 'root')

    assert next(walk_res) == res1
    assert next(walk_res) == res2
