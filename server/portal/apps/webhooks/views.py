import json
import logging
import os

from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.http import HttpResponse
from django.core.exceptions import ObjectDoesNotExist

from requests import HTTPError
from agavepy.agave import AgaveException

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


def validate_agave_job(job_uuid, job_owner, disallowed_states=[]):
    """
    Verifies that a job UUID is both visible to the owner and belongs to the owner

    Throws PortalLibException if the job owner does not match the specified job ID
    Returns:
        None if the job state is disallowed for notifications
        job_data if the job is validated

    """
    user = get_user_model().objects.get(username=job_owner)
    agave = user.agave_oauth.client
    job_data = agave.jobs.get(jobId=job_uuid)

    # Validate the job ID against the owner
    if job_data['owner'] != job_owner:
        logger.error(
            "Agave job (owner='{}', status='{}) for this event (owner='{}') is not valid".format(job_data['owner'],
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
    Dispatches notifications when receiving a POST request from the Agave
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
        job = json.loads(request.body)

        try:
            username = job['owner']
            job_id = job['id']
            archiveSystem = job['archiveSystem']
            archivePath = job['archivePath']
            job_status = job['status']
            job_name = job['name']

            try:
                job['remoteSubmitted'] = str(job['remoteSubmitted'])
                job['ended'] = str(job['ended'])
            except KeyError:
                pass

            logger.debug(job_status)

            event_data = {
                Notification.EVENT_TYPE: 'job',
                Notification.JOB_ID: job_id,
                Notification.STATUS: '',
                Notification.USER: username,
                Notification.MESSAGE: '',
                Notification.EXTRA: job
            }

            archive_id = 'agave/{}/{}'.format(archiveSystem, (archivePath.strip('/')))
            target_path = os.path.join('/workbench/data/', archive_id.strip('/'))

            # Verify the job UUID against the username
            valid_state = validate_agave_job(job_id, username)

            # Verify that the job status should generate a notification
            valid_state = valid_state is not None and job_status in settings.PORTAL_JOB_NOTIFICATION_STATES

            # If the job state is not valid for generating a notification,
            # return an OK response
            if not valid_state:
                logger.debug(
                    "Job ID {} for owner {} entered {} state (no notification sent)".format(
                        job_id, username, job_status
                    )
                )
                return HttpResponse("OK")

            if job_status == 'FAILED':
                logger.debug('JOB FAILED: id={} status={}'.format(job_id, job_status))
                logger.debug('archivePath: {}'.format(archivePath))
                event_data[Notification.STATUS] = Notification.ERROR
                event_data[Notification.MESSAGE] = "Job '{}' Failed. Please try again...".format(job_name)
                event_data[Notification.OPERATION] = 'job_failed'
                event_data[Notification.EXTRA]['target_path'] = target_path
                event_data[Notification.ACTION_LINK] = target_path

                with transaction.atomic():
                    last_notification = Notification.objects.filter(jobId=job_id).last()
                    should_notify = True

                    if last_notification:
                        last_status = last_notification.to_dict()['extra']['status']
                        logger.debug('last status: ' + last_status)

                        if job_status == last_status:
                            logger.debug('duplicate notification received.')
                            should_notify = False

                    if should_notify:
                        n = Notification.objects.create(**event_data)
                        n.save()

            elif job_status == 'FINISHED':
                logger.debug('JOB STATUS CHANGE: id={} status={}'.format(job_id, job_status))

                logger.debug('archivePath: {}'.format(archivePath))

                event_data[Notification.STATUS] = Notification.SUCCESS
                event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
                event_data[Notification.EXTRA]['target_path'] = target_path
                event_data[Notification.MESSAGE] = "Job '{}' finished".format(job_name)
                event_data[Notification.OPERATION] = 'job_finished'
                event_data[Notification.ACTION_LINK] = target_path

                with transaction.atomic():
                    last_notification = Notification.objects.filter(jobId=job_id).last()
                    should_notify = True

                    if last_notification:
                        last_status = last_notification.to_dict()['extra']['status']
                        logger.debug('last status: ' + last_status)

                        if job_status == last_status:
                            logger.debug('duplicate notification received.')
                            should_notify = False

                    if should_notify:
                        n = Notification.objects.create(**event_data)
                        n.save()
                        logger.debug('Event data with action link {}'.format(event_data))

                        try:
                            logger.debug('Preparing to Index Job Output job={}'.format(job_name))

                            agave_indexer.apply_async(args=[archiveSystem],
                                                      kwargs={'filePath': archivePath})
                            logger.debug(
                                'Finished Indexing Job Output job={}'.format(job_name))
                        except Exception as e:
                            logger.exception('Error indexing job output: {}'.format(e))
                            return HttpResponse(json.dumps(e), content_type='application/json', status=400)

            else:
                # notify
                logger.debug('JOB STATUS CHANGE: id={} status={}'.format(job_id, job_status))
                event_data[Notification.STATUS] = Notification.INFO
                event_data[Notification.MESSAGE] = "Job '{}' updated to {}.".format(job_name, job_status)
                event_data[Notification.OPERATION] = 'job_status_update'

                with transaction.atomic():
                    last_notification = Notification.objects.filter(jobId=job_id).last()

                    should_notify = True

                    if last_notification:
                        last_status = last_notification.to_dict()['extra']['status']
                        logger.debug('last status: ' + last_status)

                        if job_status == last_status:
                            logger.debug('duplicate notification received.')
                            should_notify = False

                    if should_notify:
                        n = Notification.objects.create(**event_data)
                        n.save()

                        logger.debug(n.pk)

            return HttpResponse('OK')

        except (ObjectDoesNotExist, AgaveException, PortalLibException) as e:
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
            address = request.POST.get('address', '')
            job_uuid = password

            target_uri = \
                'https://{host}/no-vnc/vnc.html?'\
                'hostname={host}&port={port}&autoconnect=true&password={pw}' \
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

        # confirm that there is a corresponding running agave job before sending notification
        try:
            valid_state = validate_agave_job(
                job_uuid, job_owner, ['FINISHED', 'FAILED', 'STOPPED']
            )
            if not valid_state:
                raise PortalLibException(
                    "Interactive Job ID {} for user {} was in invalid state".format(
                        job_uuid, job_owner
                    )
                )
            event_data[Notification.EXTRA] = valid_state
        except (HTTPError, AgaveException, PortalLibException) as e:
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
        #     agave = user.agave_oauth.client
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
