from mock import MagicMock
from requests.exceptions import HTTPError
from portal.apps.datafiles.views import TapisFilesView
import pytest
import logging

logger = logging.getLogger(__name__)

pytestmark = pytest.mark.django_db


def test_get_no_allocation(rf, regular_user, mocker, monkeypatch, mock_agave_client):
    mock_tapis_get = mocker.patch('portal.apps.datafiles.views.tapis_get_handler')
    mock_error = HTTPError()
    monkeypatch.setattr(mock_error, 'response', MagicMock(status_code=502))
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

    request = rf.get("/api/datafiles/tapis/listing/private/frontera.home.username")
    request.user = regular_user
    view = TapisFilesView()

    # The view should raise an HTTPError
    with pytest.raises(HTTPError):
        view.get(request)

    # The error code should be a 403
    try:
        view.get(request)
    except HTTPError as e:
        assert e.response.status_code == 403
