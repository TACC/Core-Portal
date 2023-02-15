import json
import logging

from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist

from requests import HTTPError
from tapipy.errors import BaseTapyException

from portal.apps.notifications.models import Notification
from portal.apps.search.tasks import agave_indexer
from portal.views.base import BaseApiView
from portal.libs.exceptions import PortalLibException
from portal.exceptions.api import ApiException
from portal.apps.webhooks.utils import (
    validate_webhook,
    execute_callback
)

from django.conf import settings

logger = logging.getLogger(__name__)

terminal_job_states = ["FINISHED", "CANCELLED", "FAILED"]


def validate_tapis_job(job_uuid, job_owner, disallowed_states=[]):
    """
    Verifies that a job UUID is both visible to the owner and belongs to the owner

    Throws PortalLibException if the job owner does not match the specified job ID
    Returns:
        None if the job state is disallowed for notifications
        job_data if the job is validated

    """
    user = get_user_model().objects.get(username=job_owner)
    client = user.tapis_oauth.client
    job_data = client.jobs.getJob(jobUuid=job_uuid)

    # Validate the job ID against the owner
    if job_data['owner'] != job_owner:
        logger.error(
            "Tapis job (owner='{}', status='{}) for this event (owner='{}') is not valid".format(job_data['owner'],
                                                                                                 job_data['status'],
                                                                                                 job_owner))
        raise PortalLibException("Unable to find a related valid job for this notification.")

    # Check to see if the job state should generate a notification
    if job_data["status"] in disallowed_states:
        return None

    return job_data


@method_decorator(csrf_exempt, name='dispatch')
class JobsWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from the Tapis
    webhook service.

    """

    def post(self, request, *args, **kwargs):
        """Notifies the user of the job status by instantiating and saving
        a Notification instance.

        If the job is finished, we also index the job and alert the user to the
        URL of the job's location in the data depot.

        Args:
            job (dict): Dictionary containing the webhook data.

        """
        subscription = json.loads(request.body)

        job = json.loads(subscription['event']['data'])

        try:
            username = job['jobOwner']
            job_id = job['jobUuid']
            job_status = job['newJobStatus']
            job_name = job['jobName']
            job_old_status = job['oldJobStatus']

            # Do nothing on job status not in portal notification states
            if job_status not in settings.PORTAL_JOB_NOTIFICATION_STATES:
                logger.info(
                    "Job ID {} for owner {} entered {} state (no notification sent)".format(
                        job_id, username, job_status
                    )
                )
                return HttpResponse("OK")

            # Do nothing on duplicate job status events
            if job_status == job_old_status:
                return HttpResponse("OK")

            logger.info('JOB STATUS CHANGE: id={} status={}'.format(job_id, job_status))

            event_data = {
                Notification.EVENT_TYPE: 'job',
                Notification.JOB_ID: job_id,
                Notification.STATUS: Notification.INFO,
                Notification.USER: username,
                Notification.MESSAGE: '',
                Notification.EXTRA: {
                    "name": job_name,
                    "owner": username,
                    "status": job_status,
                    "uuid": job_id
                }
            }

            # get additional job information only after the job has reached a terminal state
            if job_status in terminal_job_states:
                user = get_user_model().objects.get(username=username)
                client = user.tapis_oauth.client
                job_details = client.jobs.getJob(jobUuid=job_id)

                event_data[Notification.EXTRA]['remoteOutcome'] = job_details.remoteOutcome

                try:
                    logger.info('Indexing job output for job={}'.format(job_id))

                    agave_indexer.apply_async(args=[job_details.archiveSystemId],
                                              kwargs={'filePath': job_details.archiveSystemDir})
                except Exception as e:
                    logger.exception('Error starting async task to index job output: {}'.format(e))
                    return HttpResponse(json.dumps(e), content_type='application/json', status=400)

            with transaction.atomic():
                n = Notification.objects.create(**event_data)
                n.save()

            return HttpResponse('OK')

        except (ObjectDoesNotExist, BaseTapyException, PortalLibException) as e:
            logger.exception(e)
            return HttpResponse("ERROR", status=400)


@method_decorator(csrf_exempt, name='dispatch')
class InteractiveWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from interactive jobs (e.g. VNC or WEB)
    """

    def post(self, request, *args, **kwargs):
        """
        Creates a notification with a link to the interactive job event.

        """
        event_type = request.POST.get('event_type', None)
        if event_type == 'WEB':
            # This is for jobs that just point to a URL that gets created
            # like the Potree Viewer Application or DCV-based apps
            job_owner = request.POST.get('owner', '')
            address = request.POST.get('address', '')
            job_uuid = request.POST.get('job_uuid', '')
            event_data = {
                Notification.EVENT_TYPE: 'interactive_session_ready',
                Notification.STATUS: Notification.INFO,
                Notification.OPERATION: 'web_link',
                Notification.USER: job_owner,
                Notification.MESSAGE: 'Ready to view.',
                Notification.ACTION_LINK: address
            }
        elif event_type == 'VNC':

            job_owner = request.POST.get('owner', '')
            host = request.POST.get('host', '')
            port = request.POST.get('port', '')
            password = request.POST.get('password', '')
            job_uuid = password

            target_uri = \
                'https://tap.tacc.utexas.edu/noVNC/?'\
                'host={host}&port={port}&autoconnect=true&encrypt=true&resize=scale&password={pw}' \
                .format(host=host, port=port, pw=password)

            event_data = {
                Notification.EVENT_TYPE: 'interactive_session_ready',
                Notification.STATUS: Notification.INFO,
                Notification.OPERATION: 'vnc_session_start',
                Notification.USER: job_owner,
                Notification.MESSAGE: 'Your VNC session is ready.',
                Notification.ACTION_LINK: target_uri
            }

        else:
            logger.info("Unexpected event type")
            return HttpResponse("ERROR", status=400)

        # confirm that there is a corresponding running tapis job before sending notification
        try:
            valid_state = validate_tapis_job(
                job_uuid, job_owner, terminal_job_states
            )
            if not valid_state:
                raise PortalLibException(
                    "Interactive Job ID {} for user {} was in invalid state".format(
                        job_uuid, job_owner
                    )
                )
            event_data[Notification.EXTRA] = valid_state
        except (HTTPError, BaseTapyException, PortalLibException) as e:
            logger.exception(e)
            return HttpResponse("ERROR", status=400)

        n = Notification.objects.create(**event_data)
        n.save()

        # NOTE: The below metadata creation is disabled for now, as it is unused by our current frontend
        # create metadata for interactive connection and save to agave metadata
        # try:
        #     agave_job_meta = {
        #         'name': 'interactiveJobDetails',
        #         'value': {
        #             Notification.ACTION_LINK: event_data[Notification.ACTION_LINK]
        #         },
        #         'associationIds': [job_uuid],
        #     }
        #     user = get_user_model().objects.get(username=job_owner)
        #     agave = user.tapis_oauth.client
        #     agave.meta.addMetadata(body=json.dumps(agave_job_meta))

        # except (HTTPError, AgaveException) as e:
        #     logger.exception(e)
        #     return HttpResponse("ERROR", status=400)

        return HttpResponse('OK')


@method_decorator(csrf_exempt, name='dispatch')
class CallbackWebhookView(BaseApiView):
    """
    Validates incoming webhook and executes registered callbacks
    """

    def post(self, request, webhook_id):
        external_call = validate_webhook(webhook_id)
        if external_call is None:
            raise ApiException
        execute_callback(external_call, request)
        return HttpResponse('OK')
