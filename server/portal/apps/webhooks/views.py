from django.http.response import HttpResponseBadRequest
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.sessions.models import Session
from django.conf import settings

from celery import shared_task
from requests import ConnectionError, HTTPError
from agavepy.agave import Agave, AgaveException

from designsafe.apps.api.notifications.models import Notification

from designsafe.apps.api.views import BaseApiView
from designsafe.apps.api.mixins import JSONResponseMixin, SecureMixin
from designsafe.apps.api.exceptions import ApiException

from designsafe.apps.workspace.tasks import handle_webhook_request

import json
import logging

import copy
import json
import datetime
from django.utils import timezone
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from portal.apps.notifications.models import Notification
from portal.apps.signals.signals import portal_event


logger = logging.getLogger(__name__)


# class JobsWebhookView(SecureMixin, JSONResponseMixin, BaseApiView):
class JobsWebhookView(JSONResponseMixin, BaseApiView):
    """
    Dispatches notifications when receiving a POST request from the Agave
    webhook service.

    """

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JobsWebhookView, self).dispatch(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        return HttpResponse(settings.WEBHOOK_POST_URL + '/api/notifications/wh/jobs/')

    def post(self, request, *args, **kwargs):
        """
        Calls handle_webhook_request on webhook JSON body
        to notify the user of the progress of the job.

        """

        job = json.loads(request.body)
        # logger.debug(job)

        handle_webhook_request(job)
        return HttpResponse('OK')


@require_POST
@csrf_exempt
def generic_webhook_handler(request):
    event_type = request.POST.get('event_type', None)
    if event_type == 'WEB':
        # This is for jobs that just point to a URL that gets created
        # like the Potree Viewer Application
        job_owner = request.POST.get('owner', '')
        address = request.POST.get('address', '')
        event_data = {
            Notification.EVENT_TYPE: event_type,
            Notification.STATUS: Notification.INFO,
            Notification.OPERATION: 'web_link',
            Notification.USER: job_owner,
            Notification.MESSAGE: 'Ready to view.',
            Notification.EXTRA: {
                'address': address,
            }
        }
        n = Notification.objects.create(**event_data)
        n.save()
        return HttpResponse('OK')
    elif event_type == 'VNC':
        job_owner = request.POST.get('owner', '')
        host = request.POST.get('host', '')
        port = request.POST.get('port', '')
        password = request.POST.get('password', '')
        address = request.POST.get('address', '')
        job_uuid = password

        if(host == 'designsafe-exec-01.tacc.utexas.edu'):
            target_uri = 'https://' + address + \
                '&port=%s&autoconnect=true' % (port)
        else:
            # target_uri = \
            #     'https://vis.tacc.utexas.edu/no-vnc/vnc.html?' \
            #     'hostname=%s&port=%s&autoconnect=true&password=%s' % (host, port, password)
            target_uri = \
                'https://{host}/no-vnc/vnc.html?'\
                'hostname={host}&port={port}&autoconnect=true&password={pw}' \
                .format(host=host, port=port, pw=password)
        event_data = {
            Notification.EVENT_TYPE: event_type,
            Notification.STATUS: Notification.INFO,
            Notification.OPERATION: 'vnc_session_start',
            Notification.USER: job_owner,
            Notification.MESSAGE: 'Your VNC session is ready.',
            Notification.ACTION_LINK: target_uri,
            Notification.EXTRA: {
                'host': host,
                'port': port,
                'address': address,
                'password': password,
                'associationIds': job_uuid,
                'target_uri': target_uri
            }
        }
        n = Notification.objects.create(**event_data)
        n.save()

        # create metadata for VNC connection and save to agave metadata?
        try:
            agave_job_meta = {
                'name': 'interactiveJobDetails',
                'value': event_data,
                'associationIds': [job_uuid],
            }
            user = get_user_model().objects.get(username=job_owner)
            agave = user.agave_oauth.client
            agave.meta.addMetadata(body=json.dumps(agave_job_meta))

        except (HTTPError, AgaveException) as e:
            logger.exception(
                'Could not add interactive connection data to metadata')
            return HttpResponse(json.dumps(e.message), content_type='application/json',
                                status=400)

        return HttpResponse('OK')
    else:
        return HttpResponse('Unexpected', status=400)


@require_POST
@csrf_exempt
def job_notification_handler(request):
    JOB_EVENT = 'job'
    logger.debug('request body: {}'.format(request.body))

    try:
        notification = json.loads(request.body)
        logger.info('notification body: {}'.format(notification))
        logger.info('notification name: {}'.format(notification['name']))
        job_name = notification['name']
        status = notification['status']
        event = request.GET.get('event')
        job_id = request.GET.get('job_id')
        job_owner = notification['owner']
        archive_path = notification['archivePath']
    except ValueError as e:  # for testing ->used when mocking agave notification
        job_name = request.POST.get('job_name')
        status = request.POST.get('status')
        event = request.POST.get('event')
        job_id = request.POST.get('job_id')
        job_owner = request.POST.get('job_owner')
        archive_path = request.POST.get('archivePath')

    logger.info('job_name: {}'.format(job_name))
    logger.info('event: {}'.format(event))
    logger.info('job_id: {}'.format(job_id))

    body = {
        'job_name': job_name,
        'job_id': job_id,
        'event': event,
        'status': status,
        'archive_path': archive_path,
        'job_owner': job_owner,
    }
    portal_event.send_robust(None, event_type='job', event_data=body,
                              event_users=[job_owner])

    return HttpResponse('OK')
