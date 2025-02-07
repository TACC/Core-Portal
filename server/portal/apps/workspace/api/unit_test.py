import json
import pytest
from mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model


@pytest.mark.django_db(transaction=True)
class TestJobHistoryView(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        self.mock_tapis_patcher = patch('portal.apps.auth.models.TapisOAuthToken.client', autospec=True)
        self.mock_tapis_client = self.mock_tapis_patcher.start()
        self.client.force_login(get_user_model().objects.get(username="username"))

    def tearDown(self):
        self.mock_tapis_patcher.stop()

    def test_job_history_get(self):
        job_uuid = "032142c3-ac6a-42cb-841e-fbc26a2d951c-007"
        self.mock_tapis_client.jobs.getJobHistory.return_value = "mock_response"
        response = self.client.get("/api/workspace/jobs/{}/history".format(job_uuid))
        self.mock_tapis_client.jobs.getJobHistory.assert_called_with(
            jobUuid=job_uuid,
            headers={
                "X-Tapis-Tracking-ID": f"portals.{self.client.session.session_key}"
            },
        )

        data = json.loads(response.content)
        self.assertEqual(data, {"status": 200, "response": "mock_response"})
