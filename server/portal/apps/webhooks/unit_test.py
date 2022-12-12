import json
import os
from urllib.parse import urlencode
from mock import patch, MagicMock
from django.test import TestCase, TransactionTestCase, override_settings
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.urls import reverse
from portal.apps.notifications.models import Notification
from portal.apps.signals.receivers import send_notification_ws
from portal.libs.exceptions import PortalLibException
from portal.apps.webhooks.views import validate_tapis_job


class TestValidateAgaveJob(TestCase):
    def setUp(self):
        self.job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_staging.json')))
        mock_client = MagicMock()
        mock_client.jobs.getJob.return_value = self.job_event
        mock_user = MagicMock()
        mock_user.tapis_oauth.client = mock_client
        mock_user_model = MagicMock()
        mock_user_model.objects.get.return_value = mock_user
        self.user_model_patcher = patch(
            'portal.apps.webhooks.views.get_user_model',
            return_value=mock_user_model
        )
        self.user_model = self.user_model_patcher.start()

    def tearDown(self):
        self.user_model_patcher.stop()
        pass

    def test_valid_job(self):
        job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_staging.json')))
        self.assertEqual(validate_tapis_job("id", "sal"), job_event)

    def test_valid_job_invalid_user(self):
        with self.assertRaises(PortalLibException):
            validate_tapis_job("id", "wronguser")

    def test_invalid_state(self):
        self.assertEqual(validate_tapis_job("id", "sal", disallowed_states=['STAGING']), None)


class TestJobsWebhookView(TransactionTestCase):

    def setUp(self):
        signals.post_save.disconnect(sender=Notification, dispatch_uid="notification_msg")

    def tearDown(self):
        signals.post_save.connect(send_notification_ws, sender=Notification, dispatch_uid="notification_msg")

    @override_settings(PORTAL_JOB_NOTIFICATION_STATES=["STAGING"])
    @patch('portal.apps.webhooks.views.validate_tapis_job')
    def test_webhook_job_post(self, mock_validate_tapis_job):
        job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_event.json')))
        mock_validate_tapis_job.return_value = job_event
        response = self.client.post(reverse('webhooks:jobs_wh_handler'),
                                    json.dumps(job_event), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        n = Notification.objects.last()
        n_status = n.to_dict()['extra']['status']
        job_data = json.loads(job_event['event']['data'])
        self.assertEqual(n_status, job_data['newJobStatus'])

    @override_settings(PORTAL_JOB_NOTIFICATION_STATES=["RUNNING"])
    @patch('portal.apps.webhooks.views.validate_tapis_job')
    def test_webhook_job_post_invalid_state(self, mock_validate_tapis_job):
        job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_event.json')))
        mock_validate_tapis_job.return_value = job_event
        response = self.client.post(reverse('webhooks:jobs_wh_handler'),
                                    json.dumps(job_event), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(Notification.objects.all()), 0)


class TestInteractiveWebhookView(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        self.mock_agave_patcher = patch('portal.apps.auth.models.TapisOAuthToken.client', autospec=True)
        self.mock_tapis_client = self.mock_agave_patcher.start()

        self.client.force_login(get_user_model().objects.get(username="username"))

        signals.post_save.disconnect(sender=Notification, dispatch_uid="notification_msg")

        self.web_event = {
            "event_type": "WEB",
            "host": "stampede2.tacc.utexas.edu",
            "port": "1234",
            "address": "https://stampede2.tacc.utexas.edu:1234",
            "password": "3373312947011719656-242ac11b-0001-007",
            "owner": "username"
        }

        self.vnc_event = {
            "event_type": "VNC",
            "host": "stampede2.tacc.utexas.edu",
            "port": "2234",
            "password": "3373312947011719656-242ac11b-0001-007",
            "owner": "username"
        }
        self.agave_job_staging = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_staging.json')))
        self.agave_job_running = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_running.json')))
        self.agave_job_failed = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_failed.json')))

    def tearDown(self):
        self.mock_agave_patcher.stop()
        signals.post_save.connect(send_notification_ws, sender=Notification, dispatch_uid="notification_msg")

    def test_unsupported_event_type(self):
        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode({'event_type': 'DUMMY'}),
                                    content_type='application/x-www-form-urlencoded')
        self.assertTrue(response.status_code == 400)

    def test_webhook_vnc_post(self):
        self.mock_tapis_client.jobs.getJob.return_value = self.agave_job_running

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.vnc_event),
                                    content_type='application/x-www-form-urlencoded')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.mock_tapis_client.meta.addMetadata.called)
        self.assertEqual(Notification.objects.count(), 1)

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']

        self.assertEqual(action_link,
                         "https://tap.tacc.utexas.edu/noVNC/?"
                         "host=stampede2.tacc.utexas.edu&"
                         "port=2234&"
                         "autoconnect=true&"
                         "encrypt=true&"
                         "resize=scale&"
                         "password=3373312947011719656-242ac11b-0001-007")
        self.assertEqual(n.operation, 'vnc_session_start')

    def test_webhook_web_post(self):
        self.mock_tapis_client.jobs.getJob.return_value = self.agave_job_running

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.web_event),
                                    content_type='application/x-www-form-urlencoded')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.mock_tapis_client.meta.addMetadata.called)
        self.assertEqual(Notification.objects.count(), 1)

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']
        self.assertEqual(action_link, "https://stampede2.tacc.utexas.edu:1234")
        self.assertEqual(n.operation, 'web_link')

    def test_webhook_vnc_post_no_matching_job(self):
        self.mock_tapis_client.jobs.get.return_value = self.agave_job_failed

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.vnc_event),
                                    content_type='application/x-www-form-urlencoded')
        # no matching running job so it fails
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Notification.objects.count(), 0)

    def test_webhook_web_post_no_matching_job(self):
        self.mock_tapis_client.jobs.get.return_value = self.agave_job_failed

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.web_event),
                                    content_type='application/x-www-form-urlencoded')
        # no matching running job so it fails
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Notification.objects.count(), 0)
