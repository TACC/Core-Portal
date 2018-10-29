import json
import logging
import os
from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.models import signals
from portal.apps.auth.models import AgaveOAuthToken
from django.core.urlresolvers import reverse
from portal.apps.notifications.models import Notification
from urllib import urlencode


logger = logging.getLogger(__name__)


class TestJobsWebhookView(TestCase):
    fixtures = ['user-data', 'auth']

    @classmethod
    def setUpClass(cls):
        super(TestJobsWebhookView, cls).setUpClass()
        cls.mock_agave_patcher = patch('portal.apps.auth.models.AgaveOAuthToken')
        cls.mock_agave = cls.mock_agave_patcher.start()

    @classmethod
    def tearDownClass(cls):
        cls.mock_agave_patcher.stop()
        super(TestJobsWebhookView, cls).tearDownClass()

    def setUp(self):
        self.user = get_user_model().objects.get(username="username")
        signals.post_save.disconnect(sender=Notification, dispatch_uid="notification_msg")


    @patch('portal.apps.signals.receivers.send_notification_ws')
    def test_webhook_job_post(self, mock_receiver):
        signals.post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        job_event = json.load(open(os.path.join(os.path.dirname(__file__), 'fixtures/job_staging.json')))
        mock_receiver.return_value = None
        response = self.client.post(reverse('webhooks:jobs_wh_handler'), json.dumps(job_event), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        n = Notification.objects.last()
        n_status = n.to_dict()['extra']['status']
        self.assertEqual(n_status, job_event['status'])

    @patch('portal.apps.signals.receivers.send_notification_ws')
    @patch('portal.apps.webhooks.views.get_user_model')
    def test_webhook_vnc_post(self, get_user_model, mock_receiver):
        u = Mock()
        get_user_model.return_value.objects.get.return_value = u
        u.agave_oauth.client = self.mock_agave
        signals.post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        mock_receiver.return_value = None
        signals.post_save.connect(mock_receiver, sender=Notification, dispatch_uid='notification_msg')
        vnc_event = {
            "event_type": "VNC",
            "host": "vis.tacc.utexas.edu",
            "port": "2234",
            "address": "vis.tacc.utexas.edu:1234",
            "password": "3373312947011719656-242ac11b-0001-007",
            "owner": "username"
        }
        self.mock_agave.meta.addMetadata.return_value = {}
        link_from_event = "https://vis.tacc.utexas.edu/no-vnc/vnc.html?hostname=vis.tacc.utexas.edu&port=2234&autoconnect=true&password=3373312947011719656-242ac11b-0001-007"

        response = self.client.post(reverse('webhooks:interactive_wh_handler'), urlencode(
            vnc_event), content_type='application/x-www-form-urlencoded')

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']
        self.assertTrue(self.mock_agave.meta.addMetadata.called)
        self.assertEqual(action_link, link_from_event)
        self.assertEqual(n.operation, 'vnc_session_start')
        self.assertEqual(response.status_code, 200)
