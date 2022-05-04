from mock import MagicMock
import pytest


@pytest.fixture
def mock_dsl_search(mocker):
    yield mocker.patch('portal.apps.site_search.api.views.Search')


@pytest.fixture
def mock_file_search(mocker):
    yield mocker.patch('portal.apps.site_search.api.views.search_operation')


@pytest.fixture
def mock_cms_search(mocker):
    mocked_fn = mocker.patch('portal.apps.site_search.api.views.cms_search')
    mocked_fn.return_value = (1, [{'title': 'test res',
                                   'highlight': []}])
    yield mocked_fn


@pytest.fixture
def mock_files_search(mocker):
    mocked_fn = mocker.patch('portal.apps.site_search.api.views.files_search')

    mocked_fn.return_value = (1, [{'name': 'testfile',
                                           'path': '/path/to/testfile'}])
    yield mocked_fn


@pytest.fixture
def configure_public(settings):
    settings.PORTAL_DATAFILES_STORAGE_SYSTEMS = [
        {
            'name': 'Community Data',
            'system': 'portal.storage.community',
            'scheme': 'community',
            'api': 'tapis',
            'icon': None,
            'siteSearchPriority': 1
        },
        {
            'name': 'Public Data',
            'system': 'portal.storage.public',
            'scheme': 'public',
            'api': 'tapis',
            'icon': None,
            'siteSearchPriority': 0
        }
    ]


def test_search_with_auth(regular_user, client, mock_cms_search,
                          mock_files_search):
    regular_user.profile.setup_complete = True
    regular_user.profile.save()
    client.force_login(regular_user)
    response = client.get('/api/site-search/?page=0&query_string=test')

    assert response.json() == {
        'cms': {'count': 1,
                'listing': [{'title': 'test res',
                             'highlight': []}],
                'type': 'cms',
                'include': True},
        'community': {'count': 1,
                      'listing': [{'name': 'testfile',
                                           'path': '/path/to/testfile'}],
                      'type': 'file',
                      'include': True},
        'public': {'count': 1,
                   'listing': [{'name': 'testfile',
                                'path': '/path/to/testfile'}],
                   'type': 'file',
                   'include': True}}


def test_search_no_auth(client, mock_cms_search, mock_files_search):
    response = client.get('/api/site-search/?page=0&query_string=test')

    assert response.json() == {
        'cms': {'count': 1,
                'listing': [{'title': 'test res',
                             'highlight': []}],
                'type': 'cms',
                'include': True},
        'public': {'count': 1,
                   'listing': [{'name': 'testfile',
                                        'path': '/path/to/testfile'}],
                   'type': 'file',
                           'include': True}}


def test_search_public(client, configure_public, mock_cms_search,
                       mock_files_search):
    response = client.get('/api/site-search/?page=0&query_string=test')

    assert response.json() == {
        'cms': {'count': 1,
                'listing': [{'title': 'test res',
                             'highlight': []}],
                'type': 'cms',
                'include': True},
        'public': {'count': 1,
                   'listing': [{'name': 'testfile',
                                'path': '/path/to/testfile'}],
                   'type': 'file',
                   'include': True}}


def test_cms_search_util(mock_dsl_search):
    from portal.apps.site_search.api.views import cms_search
    dummy_hit = MagicMock()
    dummy_hit.to_dict.return_value = {'title': 'test title'}
    dummy_hit.meta.highlight.to_dict.return_value = {'body': ['highlight 1']}

    dummy_result = MagicMock()
    dummy_result.hits.__iter__.return_value = [dummy_hit]
    dummy_result.hits.total.value = 1

    mock_dsl_search()\
        .query()\
        .highlight()\
        .highlight()\
        .highlight_options()\
        .extra()\
        .execute.return_value = dummy_result

    res = cms_search('test_query', offset=0, limit=10)
    assert res == (1, [{'title': 'test title',
                        'highlight': {'body': ['highlight 1']}}])


def test_file_search_util(mock_file_search):
    from portal.apps.site_search.api.views import files_search
    mock_file_search.return_value = {'count': 1,
                                     'listing':
                                     [{'name': 'testfile',
                                       'path': '/path/to/testfile'}]}
    res = files_search('test_query', 'test_system')

    mock_file_search.assert_called_with(None, 'test_system', '/',
                                        query_string='test_query',
                                        filter=None,
                                        offset=0,
                                        limit=10)

    assert res == (1, [{'name': 'testfile',
                        'path': '/path/to/testfile'}])
