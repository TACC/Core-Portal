from unittest.mock import patch

from tapipy.errors import BaseTapyException

from portal.apps.site_search.api.views import SiteSearchApiView


def test_search_unauthenticated(client, regular_user):
    response = client.get("/search/")
    assert response.status_code == 200
    assert response.context["setup_complete"] is False


def test_search_authenticated_without_setup_complete(client, authenticated_user):
    response = client.get("/search/")
    assert response.status_code == 200
    assert response.context["setup_complete"] is False


def test_search_authenticated_with_setup_complete(client, authenticated_user):
    authenticated_user.profile.setup_complete = True
    authenticated_user.profile.save()
    response = client.get("/search/")
    assert response.status_code == 200
    assert response.context["setup_complete"]


@patch("portal.apps.site_search.api.views.logger")
def test_handle_tapis_ssh_exception_files_client_ssh_op_err1(mock_logger):
    view = SiteSearchApiView()
    message = "FILES_CLIENT_SSH_OP_ERR1"
    exception = BaseTapyException(message)
    view._handle_tapis_ssh_exception(exception)
    mock_logger.exception.assert_called_once_with(
        f"Error retrieving search results due to TAPIS SSH related error: message: {message}"
    )
