
from portal.apps.keyservice.models import KeyServiceOperation
from portal.apps.keyservice.callback import KeyServiceCallback
from mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.test import TransactionTestCase, TestCase
from portal.apps.keyservice.utils import (
    execute_keyservice_callback, 
    invoke_keyservice,
    _create_substitutions,
    _substitute_variables,
    substitute_user_variables
)

class TestKeyServiceExecuteCallback(TransactionTestCase):
    fixtures = [ 'users' ]
    def setUp(self):
        super(TestKeyServiceExecuteCallback, self).setUp()
        signals.post_save.disconnect(sender=KeyServiceOperation, dispatch_uid="key_service_operation")
        self.operation = KeyServiceOperation(
            callback="test.callback",
            executionId="test.executionId",
            user=get_user_model().objects.get(username="username")
        )


    def tearDown(self):
        super(TestKeyServiceExecuteCallback, self).tearDown()

    @patch('portal.apps.keyservice.utils.load_keyservice_callback')
    def test_execute_keyservice_success(self, mock_loader):
        mock_callback_instance = MagicMock()
        mock_loader.return_value = mock_callback_instance
        execute_keyservice_callback(self.operation, "mock_system")
        mock_callback_instance.success.assert_called_with(self.operation, "mock_system")

    @patch('portal.apps.keyservice.utils.service_account')
    @patch('portal.apps.keyservice.utils.load_keyservice_callback')
    def test_execute_keyservice_failure(self, mock_loader, mock_service_account):
        mock_callback_instance = MagicMock(
            actorId="MOCK_ACTOR",
            executionId="MOCK_EXECUTION_ID"
        )
        mock_loader.return_value = mock_callback_instance
        mock_actors = MagicMock()
        mock_service_account.return_value.actors = mock_actors
        execute_keyservice_callback(self.operation, "mock_system", result="failure")
        mock_callback_instance.failure.assert_called_with(self.operation, "failure") 
        mock_actors.getState.assert_called_with(actorId="test.actorId")

class TestKeyServiceInvokeService(TransactionTestCase):
    fixtures = [ 'users' ]
    
    def setUp(self):
        super(TestKeyServiceInvokeService, self).setUp()
        signals.post_save.disconnect(sender=KeyServiceOperation, dispatch_uid="key_service_operation")
        self.mock_service_account_patcher = patch('portal.apps.keyservice.utils.service_account')

        mock_execution_result = {
            "executionId": "test.executionId"
        }

        self.mock_service_account = self.mock_service_account_patcher.start()
        self.mock_service_account.return_value.actors.sendMessage.return_value = mock_execution_result
    
    def tearDown(self):
        self.mock_service_account_patcher.stop()

    def test_invoke_service(self):
        user = get_user_model().objects.get(username="username")
        variables = {
            "testvar_1": "testvalue_1"
        }
        result = invoke_keyservice(
            user, 
            "test.systemId",
            "test.template",
            variables,
            force=False,
            dryrun=False,
            callback="test.callback",
            callback_data=None
        )

        message = {
            "username": "username",
            "force": False,
            "dryrun": False, 
            "template": "test.template",
            "variables": variables,
            "webhook": "test.wh_base_url/webhooks/keyservice/"
        }
        self.mock_service_account.return_value.actors.sendMessage.assert_called_with(
            actorId="test.actorId",
            body=message
        )
        
        self.assertEquals(result.executionId, "test.executionId")

class TestKeyServiceSubstitutions(TestCase):
    fixtures = [ 'users' ]

    @classmethod
    def setUpClass(cls):
        super(TestKeyServiceSubstitutions, cls).setUpClass()
        cls.tas_patcher = patch('portal.apps.keyservice.utils.TASClient.get_user')
        cls.mock_tas = cls.tas_patcher.start()
        cls.mock_tas.return_value = {
            'homeDirectory': "MOCK_WORK"
        }

        cls.mock_home_manager_patcher = patch('portal.apps.keyservice.utils._lookup_user_home_manager')
        cls.mock_home_manager = cls.mock_home_manager_patcher.start()
        cls.mock_home_manager.return_value = MagicMock(
            get_home_dir_abs_path=MagicMock(
                return_value="/work/MOCK_WORK"
            )
        )
        cls.mock_get_home_sys_id_patcher = patch('portal.apps.keyservice.utils.get_user_home_system_id')
        cls.mock_get_home_sys_id = cls.mock_get_home_sys_id_patcher.start()
        cls.mock_get_home_sys_id.return_value = "cep.home.username"

    @classmethod
    def tearDownClass(cls):
        super(TestKeyServiceSubstitutions, cls).tearDownClass()
        cls.tas_patcher.stop()
        cls.mock_home_manager_patcher.start()

    def setUp(self):
        super(TestKeyServiceSubstitutions, self).setUp()
        self.user = get_user_model().objects.get(username="username")

    def tearDown(self):
        super(TestKeyServiceSubstitutions, self).tearDown()

    def test_create_substitutions(self):
        # Test a username that would generate an invalid Agave system name
        self.user.username = "username"
        subs = _create_substitutions(self.user)
        self.assertEquals(
            subs, 
            {
                "workdir": "/work/MOCK_WORK",
                "username": "username",
                "homesys": "cep.home.username",
                "homedir": "/work/MOCK_WORK",
                "portal": "test.portal"
            }
        )

    @patch('portal.apps.keyservice.utils._create_substitutions')
    def test_substitute_user_variables(self, mock_substitutions):
        mock_substitutions.return_value = {
            "workdir": "/work/MOCK_WORK",
            "username": "username",
            "homesys": "cep.home.username",
            "homedir": "/work/MOCK_WORK",
            "portal": "TEST_PORTAL"
        }
        systemId, variables = substitute_user_variables(
            self.user,
            "data-tacc-work-{username}",
            {
                "description": "Home system for {portal}",
                "site": "{portal}",
                "rootDir": "{workdir}",
                "name": "{homesys}",
                "id": "{homesys}"
            }
        )
        self.assertEquals(systemId, "data-tacc-work-username")
        self.assertEquals(
            variables, 
            {
                "rootDir": "/work/MOCK_WORK",
                "description": "Home system for TEST_PORTAL",
                "site": "TEST_PORTAL",
                "id": "cep.home.username",
                "name": "cep.home.username"
            }
        )

    