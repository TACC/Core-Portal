import json
import logging
import os
from mock import Mock, patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from portal.apps.auth.models import AgaveOAuthToken
from django.conf import settings
from django.core.urlresolvers import reverse
from portal.apps.notifications.models import Notification
from urllib import urlencode


logger = logging.getLogger(__name__)


class TestJobsWebhookView(TestCase):
    # @classmethod
    # def setUpClass(cls):
    #     super(TestAppsApiViews, cls).setUpClass()
    #     cls.mock_agave_patcher = patch('portal.apps.auth.models.AgaveOAuthToken')
    #     cls.mock_agave = cls.mock_agave_patcher.start()
    #
    # @classmethod
    # def tearDownClass(cls):
    #     cls.mock_agave_patcher.stop()
    #     super(TestAppsApiViews, cls).tearDownClass()

    def setUp(self):
        User = get_user_model()
        user = User.objects.create_user('test', 'test@test.com', 'test')
        token = AgaveOAuthToken(
            token_type="bearer",
            scope="default",
            access_token="123zeb_4fsf",
            refresh_token="1z23123_ec123",
            expires_in=14400,
            created=1523633447)
        token.user = user
        token.save()

    def test_get_webhook_post_url(self):
        response = self.client.get(reverse('webhooks:jobs_wh_handler'))

        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.content, str)

    def test_webhook_job_post(self):
        job_event = json.dumps(json.load(open(os.path.join(os.path.dirname(__file__),
                                                           'fixtures/job_staging.json'))))
        logger.debug(job_event)
        response = self.client.post(
            reverse('webhooks:jobs_wh_handler'), job_event, content_type='application/json')

        self.assertEqual(response.status_code, 200)

    def test_webhook_vnc_post(self):
        self.client.login(username='test', password='test')
        vnc_event = {
            "event_type": "VNC",
            "host": "vis.tacc.utexas.edu",
            "port": "2234",
            "address": "vis.tacc.utexas.edu:1234",
            "password": "3373312947011719656-242ac11b-0001-007",
            "owner": "test"
        }

        link_from_event = "https://vis.tacc.utexas.edu/no-vnc/vnc.html?hostname=vis.tacc.utexas.edu&port=2234&autoconnect=true&password=3373312947011719656-242ac11b-0001-007"

        response = self.client.post(reverse('webhooks:generic_wh_handler'), urlencode(
            vnc_event), content_type='application/x-www-form-urlencoded')

        n = Notification.objects.last()
        action_link = n.to_dict()['action_link']
        self.assertEqual(action_link, link_from_event)
