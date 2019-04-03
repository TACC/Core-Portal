import os
import json
from django.conf import settings
from mock import patch, Mock, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model

from portal.apps.workspace.managers.user_applications import UserApplicationsManager
from portal.libs.agave.models.applications import Application
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.apps.accounts.managers.user_work_home import UserWORKHomeManager


class TestUserApplicationsManager(TestCase):
    fixtures = ['users', 'auth', 'accounts']

    @classmethod
    def setUpClass(cls):
        super(TestUserApplicationsManager, cls).setUpClass()
        cls.magave_patcher = patch(
            'portal.apps.auth.models.AgaveOAuthToken.client',
            autospec=True
        )
        cls.magave = cls.magave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.magave_patcher.stop()

    def setUp(self):
        self.user = get_user_model().objects.get(username='username')

        self.user_application_manager = UserApplicationsManager(self.user)

        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/agave')
        with open(
            os.path.join(
                agave_path,
                'systems',
                'execution.json'
            )
        ) as _file:
            self.execution_sys = json.load(_file)

    @patch('portal.apps.workspace.managers.user_applications.UserWORKHomeManager', return_value=Mock(autospec=True))
    def test_set_system_definition_scratch_path_to_scratch(self, mock_user_work_home):
        mock_user_work_home().get_home_dir_abs_path.return_value = '/work/1234/username'
        sys = ExecutionSystem.from_dict(
            self.magave,
            self.execution_sys
        )

        sys.login.host='stampede2.tacc.utexas.edu'

        with patch.object(UserApplicationsManager ,'get_exec_system', return_value=sys):
            exec_sys_def = self.user_application_manager.set_system_definition('test_id', 'test_alloc')

            self.assertIn('/scratch', exec_sys_def.scratch_dir)
            self.assertNotIn('/work', exec_sys_def.scratch_dir)

    @patch('portal.apps.workspace.managers.user_applications.UserWORKHomeManager', return_value=Mock(autospec=True))
    def test_set_system_definition_scratch_path_to_work(self, mock_user_work_home):
        mock_user_work_home().get_home_dir_abs_path.return_value = '/work/1234/username'

        sys = ExecutionSystem.from_dict(
            self.magave,
            self.execution_sys
        )

        sys.login.host = 'maverick2.tacc.utexas.edu'

        with patch.object(UserApplicationsManager, 'get_exec_system', return_value=sys):
            exec_sys_def = self.user_application_manager.set_system_definition('test_id', 'test_alloc')

            self.assertIn('/work', exec_sys_def.scratch_dir)
            self.assertNotIn('/scratch', exec_sys_def.scratch_dir)
