from django.test import TestCase, RequestFactory, override_settings
from mock import patch, MagicMock
import pytest
from django.contrib.auth import get_user_model
from portal.apps.accounts.api.views.systems import SystemsListView
from portal.libs.agave.models.systems.storage import StorageSystem


@pytest.mark.django_db(transaction=True)
class TestSystemsListView(TestCase):
    fixtures = ['users', 'auth']

    @classmethod
    def setUpClass(cls):
        super(TestSystemsListView, cls).setUpClass()
        # Mock AccountsManager class
        cls.mock_AccountsManager_patcher = patch('portal.apps.accounts.api.views.systems.AccountsManager')
        cls.mock_AccountsManager = cls.mock_AccountsManager_patcher.start()

        cls.mock_client = MagicMock()
        cls.mock_client.systems.get.return_value = {}

        cls.rf = RequestFactory()
        cls.view = SystemsListView()

    @classmethod
    def tearDownClass(cls):
        super(TestSystemsListView, cls).tearDownClass()
        cls.mock_AccountsManager_patcher.stop()

    def setUp(self):
        super(TestSystemsListView, self).setUp()

    def tearDown(self):
        super(TestSystemsListView, self).tearDown()

    @override_settings(PORTAL_PROJECTS_SYSTEM_PREFIX='project.prefix')
    @patch('portal.apps.accounts.api.views.systems.JsonResponse')
    def test_project_filter(self, mock_JsonResponse):
        # Make some mock systems to be filtered
        self.mock_AccountsManager.storage_systems.return_value = [
            StorageSystem(self.mock_client, id=id) for id in [
                "project.prefix.system1",
                "project.prefix.system2",
                "not.a.project.system1",
                "not.a.project.system2"
            ]
        ]
        self.mock_AccountsManager.execution_systems.return_value = []
        request = self.rf.get("/api/accounts/systems/list")
        request.user = get_user_model().objects.get(username="username")
        self.view.get(request)

        # See what got passed to the JsonResponse object
        # (serialization doesn't work on the mocked StorageSystems)
        args, kwargs = mock_JsonResponse.call_args_list[0]

        # There should be two storage systems returned
        self.assertEqual(len(args[0]["response"]["storage"]), 2)
