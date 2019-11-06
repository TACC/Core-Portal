import json
import os
from mock import patch
from django.test import TestCase
from django.conf import settings
from django.contrib.auth import get_user_model


class TestAppsApiViews(TestCase):
    fixtures = ['users', 'auth']

    @classmethod
    def setUpClass(cls):
        super(TestAppsApiViews, cls).setUpClass()
        cls.mock_client_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client')
        cls.mock_client = cls.mock_client_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_client_patcher.stop()
        super(TestAppsApiViews, cls).tearDownClass()

    def setUp(self):
        agave_path = os.path.join(settings.BASE_DIR, 'fixtures/agave')
        with open(
            os.path.join(
                agave_path,
                'systems',
                'execution.json'
            )
        ) as _file:
            self.agave_execution = json.load(_file)

        with open(os.path.join(settings.BASE_DIR, 'fixtures', 'job-submission.json')) as f:
            self.job_data = json.load(f)

        with open(os.path.join(agave_path, 'apps', 'app-def.json')) as f:
            self.app_def = json.load(f)

    def test_apps_list(self):
        user = get_user_model().objects.get(username="username")
        self.client.force_login(user)
        apps = [
            {
                "id": "app-one",
                "executionSystem": "stampede2"
            },
            {
                "id": "app-two",
                "executionSystem": "stampede2"
            }
        ]

        #need to do a return_value on the mock_client because
        #the calling signature is something like client = Agave(**kwargs).apps.list()
        self.mock_client.apps.list.return_value = apps
        response = self.client.get('/api/workspace/apps/', follow=True)
        data = response.json()
        # If the request is sent successfully, then I expect a response to be returned.
        self.assertEqual(response.status_code, 200)
        self.assertTrue("response" in data)
        self.assertEqual(len(data["response"]), 2)
        self.assertTrue(data["response"] == apps)

    def test_job_submit_notifications(self):
        user = get_user_model().objects.get(username="username")

        app_def = self.app_def
        app_def['owner'] = user.username
        self.mock_client.apps.get.return_value = app_def

        self.mock_client.jobs.submit.return_value = {"status": "ok"}

        self.client.force_login(user)
        response = self.client.post('/api/workspace/jobs/', json.dumps(self.job_data), content_type="application/json")
        data = response.json()
        self.assertTrue("response" in data)
        self.assertTrue(self.mock_client.jobs.submit.called)
        self.assertEqual(response.status_code, 200)
        #make sure that the notifications get into the body of the job submission
        args, kwargs = self.mock_client.jobs.submit.call_args
        body = kwargs["body"]
        self.assertTrue("notifications" in body)
        notifications = body["notifications"]
        pending = {'url': 'http://testserver/webhooks/jobs/', 'event': 'PENDING'}
        finished = {'url': 'http://testserver/webhooks/jobs/', 'event': 'FINISHED'}
        self.assertTrue(pending in notifications)
        self.assertTrue(finished in notifications)

    def test_job_submit_parse_urls(self):
        user = get_user_model().objects.get(username="username")

        app_def = self.app_def
        app_def['owner'] = user.username
        self.mock_client.apps.get.return_value = app_def

        # the spaces should get quoted out
        job_data = self.job_data
        job_data["inputs"]["workingDirectory"] = "agave://test.system/name with spaces"
        self.mock_client.jobs.submit.return_value = {"status": "ok"}

        self.client.force_login(user)
        response = self.client.post('/api/workspace/jobs/', json.dumps(job_data), content_type="application/json")
        self.assertEqual(response.status_code, 200)
        args, kwargs = self.mock_client.jobs.submit.call_args
        body = kwargs["body"]
        input = body["inputs"]["workingDirectory"]
        #the spaces should have been quoted
        self.assertTrue("%20" in input)

    def test_licensed_apps(self):
        # TODO: test to make sure the licensing stuff works
        pass
