from portal.apps.workspace.models import JobSubmission
from django.contrib.auth import get_user_model
from django.test import RequestFactory, TestCase
from mock import patch, MagicMock
from django.conf import settings
from portal.apps.workspace.api.views import JobsView
from portal.apps.auth.models import AgaveOAuthToken
import json
import os
import pytest


@pytest.mark.django_db(transaction=True)
class TestJobsView(TestCase):

    @classmethod
    def setUpClass(cls):
        super(TestJobsView, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        super(TestJobsView, cls).tearDownClass()

    def setUp(self):
        super(TestJobsView, self).setUp()
        self.rf = RequestFactory()
        self.view = JobsView()
        self.user = get_user_model().objects.create_user("test", "test", "test")
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="1234fsf",
            refresh_token="123123123",
            expires_in=14400,
            created=1523633447)
        token.user = self.user
        token.save()
        self.mock_agave_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        self.mock_agave_client = self.mock_agave_patcher.start()
        self.mock_apps_manager_patcher = patch(
            'portal.apps.workspace.api.views.UserApplicationsManager'
        )
        self.mock_apps_manager = self.mock_apps_manager_patcher.start()

        with open(os.path.join(settings.BASE_DIR, 'fixtures', 'job-submission.json')) as f:
            self.job_data = json.load(f)

    def tearDown(self):
        super(TestJobsView, self).tearDown()
        JobSubmission.objects.all().delete()
        self.mock_agave_patcher.stop()
        self.mock_apps_manager.stop()

    def test_post(self):
        # Make the fake agave client return a mock job response
        self.mock_agave_client.jobs.submit.return_value = {"id": "1234"}

        # Patch the User Applications Manager to return a fake cloned app
        mock_app = MagicMock()
        mock_app.id = "mock_app"
        mock_app.exec_sys = False
        self.mock_apps_manager.return_value.get_or_create_app.return_value = mock_app

        # Send a job submission request
        request = self.rf.post(
            "/api/workspace/jobs",
            data=json.dumps(self.job_data),
            content_type="application/json"
        )
        request.user = self.user
        self.view.post(request)

        # The job submission request
        job = JobSubmission.objects.all()[0]
        self.assertEqual(job.jobId, "1234")

    def request_jobs(self, query_params={}):
        # Unit test helper function
        request = self.rf.get("/api/workspace/jobs/", query_params)
        request.user = self.user
        response = self.view.get(request)
        return json.loads(response.content)["response"]

    def test_get(self):
        # Register one job with this portal
        JobSubmission.objects.create(
            user=self.user,
            jobId="1234"
        )

        # Fake a job listing response that includes extra jobs
        self.mock_agave_client.jobs.list.return_value = [
            {"id": "1234"},
            {"id": "5678"}
        ]

        jobs = self.request_jobs()

        # Verify that all jobs get returned and have the correct isPortal value
        self.assertEqual(len(jobs), 2)
        self.assertEqual(jobs[0]["id"], "1234")
        self.assertEqual(jobs[0]["isPortal"], True)
        self.assertEqual(jobs[1]["id"], "5678")
        self.assertEqual(jobs[1]["isPortal"], False)
