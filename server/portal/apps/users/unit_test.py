from mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from pytas.http import TASClient
from portal.apps.users.utils import get_tas_allocations, get_allocations
from elasticsearch.exceptions import NotFoundError


class AttrDict(dict):

    def __getattr__(self, key):
        return self[key]

    def __setattr__(self, key, value):
        self[key] = value


class TestUserApiViews(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()

    def setUp(self):
        User = get_user_model()
        user = User.objects.create_user('test', 'test@test.com', 'test')
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = user
        token.save()
        user.is_staff = False
        user.save()

    def test_auth_view(self):
        self.client.login(username='test', password='test')
        resp = self.client.get("/api/users/auth/", follow=True)
        data = resp.json()
        self.assertEqual(resp.status_code, 200)
        # should only return user data system and community
        self.assertTrue(data["username"] == 'test')
        self.assertTrue(data["email"] == "test@test.com")
        self.assertFalse(data["isStaff"])

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
                        'name': 'Stampede 2',
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
