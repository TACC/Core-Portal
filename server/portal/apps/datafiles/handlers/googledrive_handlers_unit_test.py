import pytest
from django.core.exceptions import PermissionDenied
from portal.apps.datafiles.handlers.googledrive_handlers import \
    googledrive_get_handler, googledrive_put_handler


@pytest.fixture
def mock_operations(mocker):
    yield mocker.patch(
        'portal.apps.datafiles.handlers.googledrive_handlers.operations')


def test_get_handler(mock_googledrive_client, mock_operations):
    googledrive_get_handler(mock_googledrive_client, 'private',
                            'googledrive',
                            'id1',
                            'listing')
    mock_operations.listing.assert_called_with(mock_googledrive_client,
                                               'googledrive', 'id1')


def test_get_handler_forbidden(mock_googledrive_client, mock_operations):
    with pytest.raises(PermissionDenied):
        googledrive_get_handler(mock_googledrive_client, 'public',
                                'googledrive',
                                'id1',
                                'listing')


def test_put_handler(mock_googledrive_client, mock_operations):
    googledrive_put_handler(mock_googledrive_client, 'private',
                            'googledrive',
                            'id1',
                            'copy', body={'id': '1'})
    mock_operations.copy.assert_called_with(mock_googledrive_client,
                                            'googledrive', 'id1',
                                            **{'id': '1'})


def test_put_handler_forbidden(mock_googledrive_client, mock_operations):
    with pytest.raises(PermissionDenied):
        googledrive_put_handler(mock_googledrive_client, 'public',
                                'googledrive',
                                'id1',
                                'copy')
