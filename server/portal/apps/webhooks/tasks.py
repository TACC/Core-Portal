
import os
import json
import logging
from django.db import transaction
from agavepy.agave import AgaveException
from requests import ConnectionError, HTTPError
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from portal.apps.notifications.models import Notification
from portal.apps.search.tasks import agave_indexer


logger = logging.getLogger(__name__)


def process_job_status(job):
    """Notifies the user of the job status by instantiating and saving
    a Notification instance.

    If the job is finished, we also index the job and  alert the user to the
    URL of the job's location in the data depot.

    Args:
        job (dict): Dictionary containing the webhook data.

    """
    # logger.debug(job)
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
        archive_id = 'agave/{}/{}'.format(archiveSystem, archivePath.split('/'))

        if job_status == 'FAILED':
            logger.debug('JOB FAILED: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.ERROR
            event_data[Notification.MESSAGE] = "Job '%s' Failed. Please try again..." % (job_name)
            event_data[Notification.OPERATION] = 'job_failed'

            with transaction.atomic():
                last_notification = Notification.objects.select_for_update().filter(jobId=job_id).last()
                should_notify = True

                if last_notification:
                    last_status = last_notification.to_dict()['extra']['status']
                    logger.debug('last status: ' + last_status)

                    if job_status == last_status:
                        logger.debug('duplicate notification received.')
                        should_notify = False

                if should_notify:
                    n = Notification.objects.select_for_update().create(**event_data)
                    n.save()

        elif job_status == 'FINISHED':
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' %
                         (job_id, job_status))

            logger.debug('archivePath: {}'.format(archivePath))
            target_path = reverse('data:data_depot')
            os.path.join(target_path, 'agave', archive_id.strip('/'))
            event_data[Notification.STATUS] = Notification.SUCCESS
            event_data[Notification.EXTRA]['job_status'] = 'FINISHED'
            event_data[Notification.EXTRA]['target_path'] = target_path
            event_data[Notification.MESSAGE] = "Job '%s' finished!" % (job_name)
            event_data[Notification.OPERATION] = 'job_finished'

            with transaction.atomic():
                last_notification = Notification.objects.select_for_update().filter(jobId=job_id).last()
                should_notify = True

                if last_notification:
                    last_status = last_notification.to_dict()['extra']['status']
                    logger.debug('last status: ' + last_status)

                    if job_status == last_status:
                        logger.debug('duplicate notification received.')
                        should_notify = False

                if should_notify:
                    n = Notification.objects.select_for_update().create(**event_data)
                    n.save()
                    logger.debug('Event data with action link %s' % event_data)

                    try:
                        logger.debug('Preparing to Index Job Output job=%s', job_name)

                        agave_indexer.delay(archiveSystem, username, archivePath)
                        logger.debug('Finished Indexing Job Output job=%s', job_name)
                    except Exception as e:
                        logger.exception('Error indexing job output: {}'.format(e))

            # elif current_status and current_status == job_status:
                # DO NOT notify

        else:
            # notify
            logger.debug('JOB STATUS CHANGE: id=%s status=%s' % (job_id, job_status))
            event_data[Notification.STATUS] = Notification.INFO
            event_data[Notification.MESSAGE] = "Job '%s' updated to %s." % (job_name, job_status)
            event_data[Notification.OPERATION] = 'job_status_update'

            with transaction.atomic():
                last_notification = Notification.objects.select_for_update().filter(jobId=job_id).last()

                should_notify = True

                if last_notification:
                    last_status = last_notification.to_dict()['extra']['status']
                    logger.debug('last status: ' + last_status)

                    if job_status == last_status:
                        logger.debug('duplicate notification received.')
                        should_notify = False

                if should_notify:
                    n = Notification.objects.select_for_update().create(**event_data)
                    n.save()

                    logger.debug(n.pk)

    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user account: %s' % username)

    except HTTPError as e:
        if e.response.status_code == 404:
            logger.warning('Job not found. Cancelling job watch.',
                           extra={'job_id': job_id})
        else:
            logger.warning('Agave API error. Retrying...')

    except AgaveException as e:
        logger.warning('Agave API error. Retrying...')
