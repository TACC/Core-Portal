import json
import logging
import os
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.http import HttpResponse
from django.conf import settings
from django.views.decorators.http import require_POST
from requests import HTTPError
from agavepy.agave import Agave, AgaveException
from portal.apps.notifications.models import Notification
from django.core.exceptions import ObjectDoesNotExist
from portal.apps.search.tasks import agave_indexer
from portal.views.base import BaseApiView

logger = logging.getLogger(__name__)


class JobsWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from the Agave
    webhook service.

    """

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(JobsWebhookView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        """Notifies the user of the job status by instantiating and saving
        a Notification instance.

        If the job is finished, we also index the job and  alert the user to the
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
                job['submitTime'] = str(job['submitTime'])
                job['endTime'] = str(job['endTime'])
            except KeyError as e:
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

            if job_status == 'FAILED':
                logger.debug('JOB FAILED: id={} status={}'.format(job_id, job_status))
                event_data[Notification.STATUS] = Notification.ERROR
                event_data[Notification.MESSAGE] = "Job '{}' Failed. Please try again...".format(job_name)
                event_data[Notification.OPERATION] = 'job_failed'

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
                archive_id = 'agave/{}/{}'.format(archiveSystem, (archivePath.strip('/')))
                target_path = os.path.join('/workbench/data-depot/', archive_id.strip('/'))

                event_data[Notification.STATUS] = Notification.SUCCESS
                event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
                event_data[Notification.EXTRA]['target_path'] = target_path
                event_data[Notification.MESSAGE] = "Job '{}' finished!".format(job_name)
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

                            agave_indexer.delay(
                                archiveSystem, username, archivePath)
                            logger.debug(
                                'Finished Indexing Job Output job={}'.format(job_name))
                        except Exception as e:
                            logger.exception('Error indexing job output: {}'.format(e))
                            return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

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

        except ObjectDoesNotExist:
            logger.exception('Unable to locate local user account: {}'.format(username))
            return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

        except AgaveException as e:
            logger.warning('Agave API error')
            return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

        except Exception as e:
            logger.exception(e)
            return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)


class InteractiveWebhookView(BaseApiView):
    """
    Dispatches notifications when receiving a POST request from interactive jobs (e.g. VNC or DCV)
    """
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super(InteractiveWebhookView, self).dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        """
        Creates a notification with a link to the interactive job event.

        """

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
                    'associationIds': job_uuid
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
                return HttpResponse(json.dumps(e.message), content_type='application/json', status=400)

            return HttpResponse('OK')
        else:
            return HttpResponse('Unexpected event_type', status=400)


class OnboardingWebhookView(BaseApiView):
    pass
