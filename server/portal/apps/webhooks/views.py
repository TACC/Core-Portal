import json
import logging

from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.http import HttpResponse, HttpResponseBadRequest
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

TERMINAL_JOB_STATES = ["FINISHED", "CANCELLED", "FAILED"]


def validate_tapis_job(job_uuid, job_owner, disallowed_states=[]):
    """
    Verifies that a job UUID is both visible to the owner and belongs to the owner

    Throws PortalLibException if the job owner does not match the specified job UUID
    Returns:
        None if the job state is disallowed for notifications
        job_data if the job is validated

    """
    user = get_user_model().objects.get(username=job_owner)
    client = user.tapis_oauth.client
    job_data = client.jobs.getJob(jobUuid=job_uuid)

    # Validate the job UUID against the owner
    if job_data.owner != job_owner:
        logger.error(
            "Tapis job (owner='{}', status='{}) for this event (owner='{}') is not valid".format(job_data.owner,
                                                                                                 job_data.status,
                                                                                                 job_owner))
        raise PortalLibException("Unable to find a related valid job for this notification.")

    # Check to see if the job state should generate a notification
    if job_data.status in disallowed_states:
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
            job_uuid = job['jobUuid']
            job_status = job['newJobStatus']
            job_name = job['jobName']
            job_old_status = job['oldJobStatus']

            # Do nothing on job status not in portal notification states
            if job_status not in settings.PORTAL_JOB_NOTIFICATION_STATES:
                logger.info(
                    "Job UUID {} for owner {} entered {} state (no notification sent)".format(
                        job_uuid, username, job_status
                    )
                )
                return HttpResponse("OK")

            # Do nothing on duplicate job status events
            if job_status == job_old_status:
                return HttpResponse("OK")

            logger.info('JOB STATUS CHANGE: UUID={} status={}'.format(job_uuid, job_status))

            event_data = {
                Notification.EVENT_TYPE: 'job',
                Notification.STATUS: Notification.INFO,
                Notification.USER: username,
                Notification.EXTRA: {
                    "name": job_name,
                    "owner": username,
                    "status": job_status,
                    "uuid": job_uuid
                }
            }

            # get additional job information only after the job has reached a terminal state
            non_terminal_states = list(set(settings.PORTAL_JOB_NOTIFICATION_STATES) - set(TERMINAL_JOB_STATES))
            job_details = validate_tapis_job(job_uuid, username, disallowed_states=non_terminal_states)
            if job_details:
                event_data[Notification.EXTRA]['remoteOutcome'] = job_details.remoteOutcome

                try:
                    logger.info('Indexing job output for job={}'.format(job_uuid))

                    agave_indexer.apply_async(args=[job_details.archiveSystemId],
                                              kwargs={'filePath': job_details.archiveSystemDir})
                except Exception as e:
                    logger.exception('Error indexing job output: {}'.format(e))

            with transaction.atomic():
                n = Notification.objects.create(**event_data)
                n.save()

            return HttpResponse('OK')

        except (ObjectDoesNotExist, BaseTapyException, PortalLibException) as e:
            logger.exception(e)
            return HttpResponseBadRequest("ERROR")


@method_decorator(csrf_exempt, name='dispatch')
class InteractiveWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from interactive jobs
    """

    def post(self, request, *args, **kwargs):
        """
        Creates a notification with a link to the interactive job event.

        """

        # Get required parameters from request, else return bad request
        for param in ['event_type', 'job_uuid', 'job_owner', 'address']:
            val = request.POST.get(param, None)
            if not val:
                msg = f"Missing required interactive webhook parameter: {param}"
                logger.error(msg)
                return HttpResponseBadRequest(f"ERROR: {msg}")

            setattr(self, param, val)

        event_data = {
            Notification.EVENT_TYPE: self.event_type,
            Notification.STATUS: Notification.INFO,
            Notification.USER: self.job_owner,
            Notification.ACTION_LINK: self.address
        }

        # confirm that there is a corresponding running tapis job before sending notification
        try:
            valid_state = validate_tapis_job(job_uuid, job_owner, TERMINAL_JOB_STATES)
            if not valid_state:
                raise PortalLibException(
                    "Interactive Job UUID {} for user {} was in invalid state".format(
                        job_uuid, job_owner
                    )
                )
            event_data[Notification.EXTRA] = valid_state

        except (HTTPError, BaseTapyException, PortalLibException) as e:
            logger.exception(e)
            return HttpResponseBadRequest(f"ERROR: {e}")

        n = Notification.objects.create(**event_data)
        n.save()

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
