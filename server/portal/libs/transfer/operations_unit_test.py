import pytest
import io
from mock import MagicMock, call


@pytest.fixture
def mock_operations(mocker):
    yield mocker.patch('portal.libs.transfer.operations.tapis_operations')


@pytest.fixture
def iteration_side_effect():
    res1 = {
        'system': 'googledrive',
        'type': 'dir',
        'format': 'folder',
        'mimeType': 'application/vnd.google-apps.folder',
        'path': '/path/to/res1',
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
        'path': '/path/to/res2',
        'name': 'mockfile',
        'length': 0,
        'lastModified': 'mocktime',
        '_links': {
                'self': {'href': 'http://webviewlink'}
        }}

    yield [[res1], [res2]]


def test_transfer(mock_operations, mock_tapis_client):
    from portal.libs.transfer.operations import transfer
    mock_bytes = MagicMock(spec=io.BytesIO)
    mock_operations.download_bytes.return_value = mock_bytes
    transfer(mock_tapis_client, mock_tapis_client,
             'tapis', 'tapis',
             'src.system', 'dest.system',
             '/src/path', '/dest/path')

    mock_operations.download_bytes.assert_called_with(mock_tapis_client,
                                                      'src.system',
                                                      '/src/path')
    mock_operations.upload.assert_called_with(mock_tapis_client,
                                              'dest.system',
                                              '/dest/path',
                                              mock_bytes)


def test_transfer_folder(mock_operations, mock_tapis_client,
                         iteration_side_effect):
    from portal.libs.transfer.operations import transfer_folder

    mock_bytes = MagicMock(spec=io.BytesIO)
    mock_operations.download_bytes.return_value = mock_bytes
    mock_operations.iterate_listing.side_effect = iteration_side_effect
    mock_operations.mkdir.return_value = {'path': '/new/dir/path'}

    transfer_folder(mock_tapis_client, mock_tapis_client,
                    'tapis', 'tapis',
                    'src.system', 'dest.system',
                    '/src/path', '/dest/path',
                    'testdir')

    mock_operations.mkdir.assert_has_calls([call(mock_tapis_client,
                                                 'dest.system',
                                                 '/dest/path',
                                                 'testdir'),
                                            call(mock_tapis_client,
                                                 'dest.system',
                                                 '/new/dir/path',
                                                 'mockdir')])

    mock_operations.download_bytes.assert_called_with(mock_tapis_client,
                                                      'src.system',
                                                      '/path/to/res2')
    mock_operations.upload.assert_called_with(mock_tapis_client,
                                              'dest.system',
                                              '/new/dir/path',
                                              mock_bytes)
