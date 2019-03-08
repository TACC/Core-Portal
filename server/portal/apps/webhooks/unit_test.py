import json
import os
from urllib import urlencode
from mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.models import signals
from django.core.urlresolvers import reverse
from portal.apps.notifications.models import Notification
from portal.apps.signals.receivers import send_notification_ws


class TestJobsWebhookView(TestCase):

    def setUp(self):
        signals.post_save.disconnect(sender=Notification, dispatch_uid="notification_msg")

    def tearDown(self):
        signals.post_save.connect(send_notification_ws, sender=Notification, dispatch_uid="notification_msg")

    def test_webhook_job_post(self):
        job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_staging.json')))
        response = self.client.post(reverse('webhooks:jobs_wh_handler'), json.dumps(job_event), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        n = Notification.objects.last()
        n_status = n.to_dict()['extra']['status']
        self.assertEqual(n_status, job_event['status'])


class TestInteractiveWebhookView(TestCase):
    fixtures = ['users', 'auth']

    def setUp(self):
        self.mock_agave_patcher = patch('portal.apps.auth.models.AgaveOAuthToken.client', autospec=True)
        self.mock_agave_client = self.mock_agave_patcher.start()

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
            "host": "vis.tacc.utexas.edu",
            "port": "2234",
            "address": "vis.tacc.utexas.edu:1234",
            "password": "3373312947011719656-242ac11b-0001-007",
            "owner": "username"
        }
        self.agave_job_staging = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_staging.json')))
        self.agave_job_running = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_running.json')))

    def tearDown(self):
        self.mock_agave_patcher.stop()
        signals.post_save.connect(send_notification_ws, sender=Notification, dispatch_uid="notification_msg")

    def test_unsupported_event_type(self):
        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode({'event_type': 'DUMMY'}),
                                    content_type='application/x-www-form-urlencoded')
        self.assertTrue(response.status_code == 400)

    def test_webhook_vnc_post(self):
        self.mock_agave_client.jobs.get.return_value = self.agave_job_running

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.vnc_event),
                                    content_type='application/x-www-form-urlencoded')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.mock_agave_client.meta.addMetadata.called)
        self.assertEqual(Notification.objects.count(), 1)

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']

        self.assertEqual(action_link, "https://vis.tacc.utexas.edu/no-vnc/vnc.html?hostname=vis.tacc.utexas.edu&port=2234&autoconnect=true&password=3373312947011719656-242ac11b-0001-007")
        self.assertEqual(n.operation, 'vnc_session_start')

    def test_webhook_web_post(self):
        self.mock_agave_client.jobs.get.return_value = self.agave_job_running

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.web_event),
                                    content_type='application/x-www-form-urlencoded')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.mock_agave_client.meta.addMetadata.called)
        self.assertEqual(Notification.objects.count(), 1)

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']
        self.assertEqual(action_link, "https://stampede2.tacc.utexas.edu:1234")
        self.assertEqual(n.operation, 'web_link')

    def test_webhook_vnc_post_no_matching_job(self):
        self.mock_agave_client.jobs.get.return_value = self.agave_job_staging

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.vnc_event),
                                    content_type='application/x-www-form-urlencoded')
        # no matching running job so it fails
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Notification.objects.count(), 0)

    def test_webhook_web_post_no_matching_job(self):
        self.mock_agave_client.jobs.get.return_value = self.agave_job_staging

        response = self.client.post(reverse('webhooks:interactive_wh_handler'),
                                    urlencode(self.web_event),
                                    content_type='application/x-www-form-urlencoded')
        # no matching running job so it fails
        self.assertEqual(response.status_code, 400)
        self.assertEqual(Notification.objects.count(), 0)
