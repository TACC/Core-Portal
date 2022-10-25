import json
import pytest
from mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model


@pytest.mark.django_db(transaction=True)
class TestJobHistoryView(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        self.mock_agave_patcher = patch('portal.apps.auth.models.TapisOAuthToken.client', autospec=True)
        self.mock_tapis_client = self.mock_agave_patcher.start()
        self.client.force_login(get_user_model().objects.get(username="username"))

    def tearDown(self):
        self.mock_agave_patcher.stop()

    def test_job_history_get(self):
        job_uuid = "032142c3-ac6a-42cb-841e-fbc26a2d951c-007"
        self.mock_tapis_client.jobs.getHistory.return_value = "mock_response"
        response = self.client.get("/api/workspace/jobs/{}/history".format(job_uuid))
        self.mock_tapis_client.jobs.getHistory.assert_called_with(jobId=job_uuid)
        data = json.loads(response.content)
        self.assertEqual(data, {"response": "mock_response"})
