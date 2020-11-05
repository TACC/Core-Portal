from django.contrib.auth import get_user_model
from portal.apps.onboarding.steps.project_membership import ProjectMembershipStep
import pytest


@pytest.fixture
def tas_client_projects_for_user_mock(mocker):
    task_client_mock = mocker.patch('portal.apps.onboarding.steps.project_membership.TASClient', autospec=True)
    task_client_mock.return_value.projects_for_user.return_value = [
        {"chargeCode": "TACC-Team"}, {"chargeCode": "MyProject"}]
    yield task_client_mock


@pytest.fixture
def project_membership_step(authenticated_user):
    step = ProjectMembershipStep(get_user_model().objects.get(username=authenticated_user.username))
    yield step


@pytest.fixture
def project_membership_fail_mock(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'fail')


@pytest.fixture
def project_membership_complete_mock(mocker):
    yield mocker.patch.object(ProjectMembershipStep, 'complete')


class ProjectMembershipStepTest(TestCase):
    fixtures = [ 'users' ]

    @classmethod
    def setUpClass(cls):
        super(ProjectMembershipStepTest, cls).setUpClass()

        # Mock TAS Client
        cls.mock_tas_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.get_tas_client'
        )
        cls.mock_tas = cls.mock_tas_patcher.start()

        # Mock TAS Project retrieval
        cls.mock_get_project_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.get_tas_project'
        )
        cls.mock_get_project = cls.mock_get_project_patcher.start()
        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/tas')
        with open(
            os.path.join(settings.BASE_DIR, 'fixtures/tas', 'project.json')
        ) as _file:
            cls.project = json.load(_file)
        cls.mock_get_project.return_value = cls.project

        # Mock RT Tracker
        cls.mock_tracker_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.get_tracker'
        )
        cls.mock_tracker = cls.mock_tracker_patcher.start()

        # Mock the step's complete function so we can spy on it
        cls.mock_complete_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.complete'
        )
        cls.mock_complete = cls.mock_complete_patcher.start()

        # Mock the step's log function so we can spy on it
        cls.mock_log_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.log'
        )
        cls.mock_log = cls.mock_log_patcher.start()

        # Mock the step's fail function so we can spy on it
        cls.mock_fail_patcher = patch(
            'portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.fail'
        )
        cls.mock_fail = cls.mock_fail_patcher.start()

    @classmethod
    def tearDownClass(cls):
        super(ProjectMembershipStepTest, cls).tearDownClass()
        cls.mock_complete_patcher.stop()
        cls.mock_log_patcher.stop()
        cls.mock_tracker_patcher.stop()
        cls.mock_tas_patcher.stop()
        cls.mock_get_project_patcher.stop()

    def setUp(self):
        super(ProjectMembershipStepTest, self).setUp()
        self.user = get_user_model().objects.get(username="username")
        self.step = ProjectMembershipStep(self.user)
        self.rf = RequestFactory()

    def tearDown(self):
        super(ProjectMembershipStepTest, self).tearDown()

    def test_is_project_member(self):
        self.mock_tas.return_value.projects_for_user.return_value = [ self.project ]
        self.assertTrue(self.step.is_project_member())
        self.mock_tas.return_value.projects_for_user.return_value = [ ]
        self.assertFalse(self.step.is_project_member())

    @patch('portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.is_project_member')
    def test_process_user_is_member(self, mock_is_member):
        mock_is_member.return_value = True
        self.step.process()
        self.mock_complete.assert_called_with(
            "You have the required project membership to access this portal."
        )

    @patch('portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.is_project_member')
    def test_process_user_is_not_member(self, mock_is_member):
        mock_is_member.return_value = False
        self.step.process()
        self.mock_log.assert_called_with(
            "Please confirm your request to use this portal.",
            data={
                "more_info": self.step.message
            }
        )

    def test_send_project_request(self):
        request = self.rf.get("https://cep.dev/")
        request.user = self.user
        self.step.send_project_request(request)
        self.mock_tracker.assert_called_with()
        _, kwargs = self.mock_tracker.return_value.create_ticket.call_args_list[0]

        self.assertEqual(kwargs['Requestors'], "username@server.com")
        self.assertIn("/onboarding/setup/username", kwargs['Text'])

    def test_add_to_project(self):
        self.step.user = self.user
        self.step.add_to_project()
        self.mock_tas.return_value.add_project_user.assert_called_with(
            23881, 
            self.user.username
        )

    def test_close_project_request(self):
        self.step.events = [
            SetupEvent(user=self.user),
            SetupEvent(user=self.user, data={}),
            SetupEvent(user=self.user, data={ "ticket": "1234" }),
            SetupEvent(user=self.user, data={ "ticket": "12345" })
        ]
        self.step.close_project_request()
        self.mock_tracker.return_value.reply.assert_called_with("12345", text=ANY)
        self.mock_tracker.return_value.comment.assert_called_with("12345", text=ANY)
        self.mock_tracker.return_value.edit_ticket.assert_called_with("12345", Status='resolved')

    @patch('portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.send_project_request')
    @patch('portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.add_to_project')
    @patch('portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.close_project_request')
    def test_client_action(self, mock_close, mock_add, mock_send):
        request = self.rf.get("/api/onboarding")
        request.user = self.user
        self.step.client_action("user_confirm", {}, request)
        mock_send.assert_called_with(request)
        request.user.is_staff = True
        self.step.client_action("staff_approve", {}, request)
        mock_add.assert_called_with()
        mock_close.assert_called_with()
        self.mock_complete.assert_called_with(ANY)

    @patch('portal.apps.onboarding.steps.project_membership.ProjectMembershipStep.add_to_project')
    def test_client_action_fail(self, mock_add):
        mock_add.side_effect = Exception("Mock exception", "Mock reason")
        request = self.rf.get("/api/onboarding")
        request.user = self.user
        request.user.is_staff = True
        self.step.client_action("staff_approve", {}, request)
        self.mock_fail.assert_called_with(
            "An error occurred while trying to add this user to the project"
        )