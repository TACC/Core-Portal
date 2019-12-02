from django.test import TestCase, RequestFactory, override_settings
from django.contrib.auth import get_user_model
from mock import patch, ANY, MagicMock
from portal.apps.onboarding.models import SetupEvent
from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.mfa import MFAStep

class MFAStepTest(TestCase):
    def setUp(self):
        super(MFAStepTest, self).setUp()
        self.user = get_user_model().objects.create_user('test', 'test@user.com', 'test')

        # Mock the step's complete function so we can spy on it
        self.mock_complete_patcher = patch(
            'portal.apps.onboarding.steps.mfa_unit_test.MFAStep.complete'
        )
        self.mock_complete = self.mock_complete_patcher.start()

        # Mock the step's fail function so we can spy on it
        self.mock_log_patcher = patch(
            'portal.apps.onboarding.steps.mfa_unit_test.MFAStep.log'
        )
        self.mock_log = self.mock_log_patcher.start()

        self.mock_response = MagicMock(
            json=MagicMock(
                return_value={
                    "result" : [
                        { "type" : "tacc-soft-token" }
                    ]
                }
            )
        )

        # Mock get allocations
        self.mock_requests_get_patcher = patch(
            'portal.apps.onboarding.steps.mfa.requests.get',
            return_value=self.mock_response
        )
        self.mock_requests_get = self.mock_requests_get_patcher.start()

        self.step = MFAStep(self.user)

    def tearDown(self):
        super(MFAStepTest, self).tearDown()
        self.mock_complete_patcher.stop()
        self.mock_log_patcher.stop()
        self.mock_requests_get_patcher.stop()

    @patch('portal.apps.onboarding.steps.mfa_unit_test.MFAStep.mfa_check')
    def test_mfa_found(self, mock_mfa_check):
        mock_mfa_check.return_value = True
        self.step.process()
        self.mock_complete.assert_called_with(
            "Multi-factor authentication pairing verified"
        )

    @patch('portal.apps.onboarding.steps.mfa_unit_test.MFAStep.mfa_check')
    def test_mfa_not_found(self, mock_mfa_check):
        mock_mfa_check.return_value = False
        self.step.process()
        self.mock_log.assert_called_with(ANY, data=ANY)
    
    def test_mfa_check(self):
        result = self.step.mfa_check()
        self.assertEquals(result, True)

    def test_mfa_check_failure(self):
        self.mock_response.json.return_value["result"] = [ ]
        result = self.step.mfa_check()
        self.assertEquals(result, False)

    @patch('portal.apps.onboarding.steps.mfa_unit_test.MFAStep.prepare')
    def test_client_action(self, mock_prepare):
        request = RequestFactory().post("/api/onboarding/user/test")
        request.user = self.user
        self.step.client_action("user_confirm", {}, request)
        mock_prepare.assert_called_with()
