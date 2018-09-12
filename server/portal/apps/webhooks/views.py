import json
import logging
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponse
from django.conf import settings
from django.views.decorators.http import require_POST
from requests import HTTPError
from agavepy.agave import Agave, AgaveException
from portal.apps.notifications.models import Notification
from portal.views.base import BaseApiView
from .tasks import process_job_status

logger = logging.getLogger(__name__)


class JobsWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from the Agave
    webhook service.

    """

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JobsWebhookView, self).dispatch(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        return HttpResponse(settings.WEBHOOK_POST_URL + reverse('webhooks:jobs_wh_handler'))

    def post(self, request, *args, **kwargs):
        """
        Calls process_job_status on webhook JSON body
        to notify the user of the progress of the job.

        """

        job = json.loads(request.body)
        # logger.debug(job)

        process_job_status(job)
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
