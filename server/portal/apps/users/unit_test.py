from mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import TapisOAuthToken
from pytas.http import TASClient
from portal.apps.users.utils import get_tas_allocations, get_allocations
from elasticsearch.exceptions import NotFoundError
from zeep.exceptions import Fault
import pytest
import json
import os
from django.conf import settings


class AttrDict(dict):

    def __getattr__(self, key):
        return self[key]

    def __setattr__(self, key, value):
        self[key] = value


class TestUserApiViews(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_client_patcher = patch('portal.apps.auth.models.TapisOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()
        

    def setUp(self):
        User = get_user_model()
        user = User.objects.create_user('test', 'test@test.com', 'test')
        token = TapisOAuthToken(
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = user
        token.save()
        user.is_staff = False
        user.is_superuser = False
        user.save()
    
    def test_auth_view(self):
        self.client.login(username='test', password='test')
        resp = self.client.get("/api/users/auth/", follow=True)
        data = resp.json()
        self.assertEqual(resp.status_code, 200)
        # should only return user data system and community
        self.assertTrue(data["username"] == 'test')
        self.assertTrue(data["email"] == "test@test.com")

    def test_auth_view_noauth(self):
        resp = self.client.get("/api/users/auth/", follow=True)
        self.assertEqual(resp.status_code, 401)
        # should only return user data system and community

    @patch('portal.apps.users.views.IndexedFile')
    def test_usage_view(self, mocked_file):
        # TODO: this is hideous, there must be a better way to write that or
        # re-write the route to be less disgusting.
        mocked_file.search.return_value.filter.return_value.extra.return_value.execute.return_value.to_dict.return_value = {
            "aggregations": {
                "total_storage_bytes": {"value": 10}
            }
        }
        self.client.login(username='test', password='test')
        resp = self.client.get("/api/users/usage/systemId", follow=True)
        data = resp.json()
        self.assertTrue(data["total_storage_bytes"] == 10)

    def test_usage_view_noauth(self):
        # TODO: API routes should return a 401 not a 302 that redirects to login
        resp = self.client.get("/api/users/usage/systemId")
        self.assertTrue(resp.status_code == 302)


class TestGetAllocations(TestCase):
    def setUp(self):
        super(TestGetAllocations, self).setUp()
        self.mock_tas_patcher = patch(
            'portal.apps.users.utils.TASClient',
            spec=TASClient
        )
        self.mock_tas = self.mock_tas_patcher.start()

    def tearDown(self):
        super(TestGetAllocations, self).tearDown()
        self.mock_tas_patcher.stop()

    @patch('portal.apps.users.utils.IndexedAllocation')
    @patch('portal.apps.users.utils.get_tas_allocations')
    def test_force_get_allocations(self, mock_get, mock_idx):
        mock_get.return_value = []
        get_allocations("username", force=True)
        mock_get.assert_called_with("username")

    def test_allocations_returned(self):
        self.mock_tas.return_value.projects_for_user.return_value = [
            {
                "title": "Big Project",
                "chargeCode": "Big-Proj",
                "id": "Test-ID",
                "pi": {
                    "firstName": "Test",
                    "lastName": "User"
                },
                "allocations": [
                    {
                        "status": "Active",
                        "resource": "Frontera"
                    }
                ]
            },
            {
                "title": "Old Proj",
                "chargeCode": "Proj-Old",
                "id": "Test-ID",
                "pi": {
                    "firstName": "Old",
                    "lastName": "User"
                },
                "allocations": [
                    {
                        "status": "Inactive",
                        "resource": "Stampede4"
                    }
                ]
            },
            {
                "title": "A Proj",
                "chargeCode": "Proj-Code",
                "id": "Test-ID",
                "pi": {
                    "firstName": "Another",
                    "lastName": "User"
                },
                "allocations": [
                    {
                        "status": "Active",
                        "resource": "Rodeo2"
                    }
                ]
            }
        ]
        active_expected = [
            {
                "projectName": "Big-Proj",
                "projectId": "Test-ID",
                "systems": [
                    {
                        'allocation': {'resource': 'Frontera', 'status': 'Active'},
                        'host': 'frontera.tacc.utexas.edu',
                        'name': 'Frontera',
                        'type': 'HPC'
                    }
                ],
                "title": "Big Project",
                "pi": "Test User"
            },
            {
                "projectName": "Proj-Code",
                "projectId": "Test-ID",
                "systems": [
                    {
                        'allocation': {'resource': 'Rodeo2', 'status': 'Active'},
                        'host': 'rodeo.tacc.utexas.edu',
                        'name': 'Rodeo',
                        'type': 'STORAGE'
                    }
                ],
                "title": "A Proj",
                "pi": "Another User"
            }
        ]

        inactive_expected = [
            {
                "projectName": "Proj-Old",
                "projectId": "Test-ID",
                "systems": [
                    {
                        'allocation': {'resource': 'Stampede4', 'status': 'Inactive'},
                        'host': 'stampede2.tacc.utexas.edu',
                        'name': 'Stampede2',
                        'type': 'HPC'
                    }
                ],
                "title": "Old Proj",
                "pi": "Old User"
            }
        ]

        hosts_expected = {
            'rodeo.tacc.utexas.edu': ['Proj-Code'],
            'frontera.tacc.utexas.edu': ['Big-Proj']
        }

        data_expected = {
            'active': active_expected,
            'inactive': inactive_expected,
            'hosts': hosts_expected,
            'portal_alloc': 'test'
        }

        data = get_tas_allocations("username")
        self.assertEqual(data, data_expected)


class TestGetIndexedAllocations(TestCase):

    @patch('portal.apps.users.utils.IndexedAllocation')
    def test_checks_allocations(self, mock_idx):
        get_allocations('testuser')
        mock_idx.from_username.assert_called_with('testuser')

    @patch('portal.apps.users.utils.IndexedAllocation')
    @patch('portal.apps.users.utils.get_tas_allocations')
    def test_allocation_fallback(self, mock_get_alloc, mock_idx):
        mock_idx.from_username.side_effect = NotFoundError
        get_allocations('testuser')
        mock_get_alloc.assert_called_with('testuser')
        mock_idx().save.assert_called_with()


@pytest.fixture
def tas_add_user_response():
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_add_user_to_project.json')) as f:
        yield json.load(f)


@pytest.fixture
def tas_delete_user_response():
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_delete_user_from_project.json')) as f:
        yield json.load(f)


@pytest.fixture
def tas_add_user_error_response():
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_add_user_to_project_error.json')) as f:
        yield json.load(f)


@pytest.fixture
def tas_delete_user_error_response():
    with open(os.path.join(settings.BASE_DIR, 'fixtures/tas/tas_delete_user_from_project_error.json')) as f:
        yield json.load(f)


def test_add_user(client, requests_mock, authenticated_user, tas_add_user_response):
    requests_mock.post("{}/v1/projects/1234/users/5678".format(settings.TAS_URL), json=tas_add_user_response)
    response = client.post('/api/users/team/manage/1234/5678')
    assert response.status_code == 200
    assert response.json() == {"response": 'ok'}


def test_add_user_unauthenticated(client):
    response = client.post('/api/users/team/manage/1234/5678')
    assert response.status_code == 302


def test_add_user_failure(client, requests_mock, authenticated_user, tas_add_user_error_response):
    requests_mock.post("{}/v1/projects/1234/users/5678".format(settings.TAS_URL), json=tas_add_user_error_response)
    response = client.post('/api/users/team/manage/1234/5678')
    assert response.status_code == 400


def test_delete_user(client, requests_mock, authenticated_user, tas_delete_user_response):
    requests_mock.delete("{}/v1/projects/1234/users/5678".format(settings.TAS_URL), json=tas_delete_user_response)
    response = client.delete('/api/users/team/manage/1234/5678')
    assert response.status_code == 200
    assert response.json() == {"response": 'ok'}


def test_delete_user_unauthenticated(client):
    response = client.delete('/api/users/team/manage/1234/5678')
    assert response.status_code == 302


def test_delete_user_failure(client, requests_mock, authenticated_user, tas_delete_user_error_response):
    requests_mock.delete("{}/v1/projects/1234/users/5678".format(settings.TAS_URL), json=tas_delete_user_error_response)
    response = client.delete('/api/users/team/manage/1234/5678')
    assert response.status_code == 400


@pytest.fixture
def mock_tas_account1(mocker):
    mock_account = mocker.MagicMock()
    mock_account.Login = "username1"
    mock_account.Person.Email = "user1@user.com"
    mock_account.Person.FirstName = "firstName1"
    mock_account.Person.LastName = "commonLastName"
    yield mock_account


@pytest.fixture
def mock_tas_account2(mocker):
    mock_account = mocker.MagicMock()
    mock_account.Login = "username2"
    mock_account.Person.Email = "user2@user.com"
    mock_account.Person.FirstName = "firstName2"
    mock_account.Person.LastName = "commonLastName"
    yield mock_account


@pytest.fixture
def mock_tas_zeep_client(mocker):
    zeep_client = mocker.patch('portal.apps.users.views.Client', autospec=True)
    zeep_client.return_value.service.GetAccountsByLastName.return_value = []
    zeep_client.return_value.service.GetAccountsByEmail.return_value = []
    zeep_client.return_value.service.GetAccountByLogin.side_effect = Fault("None")
    yield zeep_client.return_value


def test_search_tas_user_unauthenticated(client):
    response = client.get('/api/users/tas-users/', {"search": "foo"})
    assert response.status_code == 302


def test_search_tas_empty_response(client, authenticated_user, mock_tas_zeep_client):
    response = client.get('/api/users/tas-users/', {"search": "foo"})
    assert response.status_code == 200
    assert response.json() == {"result": []}


def test_search_tas(client, authenticated_user, mock_tas_zeep_client, mock_tas_account1, mock_tas_account2):
    mock_tas_zeep_client.service.GetAccountsByLastName.return_value = [mock_tas_account1, mock_tas_account2]
    mock_tas_zeep_client.service.GetAccountsByEmail.return_value = [mock_tas_account1, mock_tas_account2]
    response = client.get('/api/users/tas-users/', {"search": "foo"})
    assert response.status_code == 200
    assert response.json() == {"result": [{"username": "username1", "email": "user1@user.com",
                                           "firstName": "firstName1", "lastName": "commonLastName"},
                                          {"username": "username2", "email": "user2@user.com",
                                           "firstName": "firstName2", "lastName": "commonLastName"}]}
