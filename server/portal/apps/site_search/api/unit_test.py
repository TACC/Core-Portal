from mock import MagicMock
from tapipy.errors import BaseTapyException
import pytest


@pytest.fixture
def mock_dsl_search(mocker):
    yield mocker.patch("portal.apps.site_search.api.views.Search")


@pytest.fixture
def mock_file_search(mocker):
    yield mocker.patch("portal.apps.site_search.api.views.search_operation")


@pytest.fixture
def mock_cms_search(mocker):
    mocked_fn = mocker.patch("portal.apps.site_search.api.views.cms_search")
    mocked_fn.return_value = (1, [{"title": "test res", "highlight": []}])
    yield mocked_fn


@pytest.fixture
def mock_service_account(mocker):
    yield mocker.patch(
        "portal.apps.site_search.api.views.service_account", autospec=True
    )


@pytest.fixture
def mock_files_search(mocker):
    mocked_fn = mocker.patch("portal.apps.site_search.api.views.files_search")

    mocked_fn.return_value = (1, [{"name": "testfile", "path": "/path/to/testfile"}])
    yield mocked_fn


@pytest.fixture
def configure_public(settings):
    settings.PORTAL_DATAFILES_STORAGE_SYSTEMS = [
        {
            "name": "Community Data",
            "system": "portal.storage.community",
            "scheme": "community",
            "api": "tapis",
            "icon": None,
            "siteSearchPriority": 1,
        },
        {
            "name": "Public Data",
            "system": "portal.storage.public",
            "scheme": "public",
            "api": "tapis",
            "icon": None,
            "siteSearchPriority": 0,
        },
    ]


def test_search_with_auth(regular_user, client, mock_cms_search, mock_files_search):
    regular_user.profile.setup_complete = True
    regular_user.profile.save()
    client.force_login(regular_user)
    response = client.get("/api/site-search/?page=0&query_string=test")

    assert response.json() == {
        "cms": {
            "count": 1,
            "listing": [{"title": "test res", "highlight": []}],
            "type": "cms",
            "include": True,
        },
        "community": {
            "count": 1,
            "listing": [{"name": "testfile", "path": "/path/to/testfile"}],
            "type": "file",
            "include": True,
        },
        "public": {
            "count": 1,
            "listing": [{"name": "testfile", "path": "/path/to/testfile"}],
            "type": "file",
            "include": True,
        },
    }


@pytest.mark.parametrize(
    "tapis_test_config",
    [
        {
            "public": {
                "tapis_error_msg": "SSH_POOL_MISSING_CREDENTIALS",
            },
            "community": {
                "tapis_error_msg": "SSH_POOL_MISSING_CREDENTIALS",
            },
            "search_result_has_error": False,
        },
        {
            "public": {
                "tapis_error_msg": "SSH_FX_PERMISSION_DENIED",
            },
            "community": {
                "tapis_error_msg": "SSH_FX_PERMISSION_DENIED",
            },
            "search_result_has_error": False,
        },
        {
            "public": {
                "tapis_error_msg": "InternalServerError",
            },
            "community": {
                "tapis_error_msg": "InternalServerError",
            },
            "search_result_has_error": True,
        },
        {
            "public": {
                "tapis_error_msg": "InternalServerError",
            },
            "community": {
                "tapis_error_msg": "SSH_FX_PERMISSION_DENIED",
            },
            "search_result_has_error": True,
        },
    ],
)
def test_search_with_tapis_error(
    regular_user, client, mock_cms_search, mocker, tapis_test_config
):
    # Test if does not error out when public or community search fails with SSH related errors.
    # file search return different error based on the type.
    def file_search_side_effect(*args, **kwargs):
        system_value = kwargs.get("system")
        # Check the specific parameter value and return different results
        if system_value == "portal.storage.community":
            raise BaseTapyException(tapis_test_config["community"]["tapis_error_msg"])
        else:
            raise BaseTapyException(tapis_test_config["public"]["tapis_error_msg"])

    regular_user.profile.setup_complete = True
    regular_user.profile.save()
    client.force_login(regular_user)
    mocker.patch(
        "portal.apps.site_search.api.views.files_search",
        side_effect=file_search_side_effect,
    )
    response = client.get("/api/site-search/?page=0&query_string=test")
    # if it is an unhandled error code expect the search to fail.
    if tapis_test_config["search_result_has_error"]:
        assert response.json() == {"message": "message: InternalServerError"}
    else:
        assert response.json() == {
            "cms": {
                "count": 1,
                "listing": [{"title": "test res", "highlight": []}],
                "type": "cms",
                "include": True,
            }
        }


def test_search_no_auth(
    client, mock_cms_search, mock_files_search, mock_service_account
):
    response = client.get("/api/site-search/?page=0&query_string=test")

    assert response.json() == {
        "cms": {
            "count": 1,
            "listing": [{"title": "test res", "highlight": []}],
            "type": "cms",
            "include": True,
        },
        "public": {
            "count": 1,
            "listing": [{"name": "testfile", "path": "/path/to/testfile"}],
            "type": "file",
            "include": True,
        },
    }


def test_search_public(
    client, configure_public, mock_cms_search, mock_files_search, mock_service_account
):
    response = client.get("/api/site-search/?page=0&query_string=test")

    assert response.json() == {
        "cms": {
            "count": 1,
            "listing": [{"title": "test res", "highlight": []}],
            "type": "cms",
            "include": True,
        },
        "public": {
            "count": 1,
            "listing": [{"name": "testfile", "path": "/path/to/testfile"}],
            "type": "file",
            "include": True,
        },
    }


def test_cms_search_util(mock_dsl_search):
    from portal.apps.site_search.api.views import cms_search

    dummy_hit = MagicMock()
    dummy_hit.to_dict.return_value = {"title": "test title"}
    dummy_hit.meta.highlight.to_dict.return_value = {"body": ["highlight 1"]}

    dummy_result = MagicMock()
    dummy_result.hits.__iter__.return_value = [dummy_hit]
    dummy_result.hits.total.value = 1

    mock_dsl_search().query().highlight().highlight().highlight_options().extra().execute.return_value = (
        dummy_result
    )

    res = cms_search("test_query", offset=0, limit=10)
    assert res == (1, [{"title": "test title", "highlight": {"body": ["highlight 1"]}}])


def test_file_search_util(mock_file_search, regular_user):
    from portal.apps.site_search.api.views import files_search

    mock_file_search.return_value = {
        "count": 1,
        "listing": [{"name": "testfile", "path": "/path/to/testfile"}],
    }
    client = regular_user.tapis_oauth.client
    res = files_search(
        client,
        "test_query",
        "test_system",
        "/",
    )

    mock_file_search.assert_called_with(
        client,
        "test_system",
        "/",
        query_string="test_query",
        filter=None,
        offset=0,
        limit=10,
    )

    assert res == (1, [{"name": "testfile", "path": "/path/to/testfile"}])
