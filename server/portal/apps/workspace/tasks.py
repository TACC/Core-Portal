from __future__ import absolute_import
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from agavepy.agave import AgaveException
from celery import shared_task
from requests import ConnectionError, HTTPError
import logging
from portal.apps.signals.signals import portal_event
from portal.apps.notifications.models import Notification

logger = logging.getLogger(__name__)

class JobSubmitError(Exception):

    def __init__(self, *args, **kwargs):
        self.status = kwargs.pop('status', 'error')
        self.status_code = kwargs.pop('status_code', 500)
        self.message = kwargs.pop('message', None)

    def json(self):
        return {
            'status': getattr(self, 'status', 'error'),
            'message': getattr(self, 'message', None)
        }


def _send_portal_event(event_data, username):
    portal_event.send(
        None,
        event_type='job',
        event_data=event_data,
        event_users=[username]
    )



def submit_job(request, username, job_post):
    logger.info('Submitting job for user=%s: %s' % (username, job_post))

    try:
        user = get_user_model().objects.get(username=username)
        agave = user.agave_oauth.client
        response = agave.jobs.submit(body=job_post)
        logger.debug('Job Submission Response: {}'.format(response))

        # watch job status
        watch_job_status.apply_async(args=[username, response['id']], countdown=10, queue='api')
        return response

    except ConnectionError as e:
        logger.error('ConnectionError while submitting job: %s' % e.message,
                     extra={'job': job_post})
        raise JobSubmitError(status='error',
                             status_code=500,
                             message='We were unable to submit your job at this time due '
                                     'to a Job Service Interruption. Please try again later.')

    except HTTPError as e:
        logger.error('HTTPError while submitting job: %s' % e.message,
                       extra={'job': job_post})
        if e.response.status_code >= 500:
            raise JobSubmitError(
                status='error',
                status_code=e.response.status_code,
                message='We were unable to submit your job at this time due '
                        'to a Job Service Interruption. Please try again later.')

        err_resp = e.response.json()
        err_resp['status_code'] = e.response.status_code
        logger.warning(err_resp)
        raise JobSubmitError(**err_resp)

@shared_task(bind=True, max_retries=None)
def watch_job_status(self, username, job_id, current_status=None):
    try:

        user = get_user_model().objects.get(username=username)
        ag = user.agave_oauth.client
        job = ag.jobs.get(jobId=job_id)

        try:
        #job['submitTime'] is a datetime object
            job['submitTime']=str(job['submitTime'])
            job['endTime']=str(job['endTime'])
        except KeyError as e:
            pass #unfinished jobs won't have an endTime

        job_status = job['status']
        #if job_status == 'FINISHED':
        #    job_status = 'INDEXING'

        job_name = job['name']
        event_data = {
            "event_type": 'job',
            "status": '',
            "user": username,
            "message": '',
            "extra": job
        }

        archive_id = 'agave/%s/%s' % (job['archiveSystem'], job['archivePath'].split('/'))

        if job_status == 'FAILED':
            # end state, no additional tasks; notify
            event_data["status"] = "error"
            event_data["message"] = 'Job "%s" Failed. Please try again...' % (job_name, )
            n = Notification.objects.create(**event_data)
            n.save()
        elif job_status == 'FINISHED':
            # end state, start indexing outputs
            event_data["status"] = "success"
            event_data["extra"]['job_status'] = 'FINISHED'
            event_data["message"] = 'Job "%s" has finished!' % (job_name, )
            event_data["operation"] = 'job_finished'
            n = Notification.objects.create(**event_data)
            n.save()

        elif current_status and current_status == job_status:
            # DO NOT notify, but still queue another watch task

            self.retry(countdown=10, kwargs={'current_status': job_status})
        else:
            # notify
            event_data["status"] = "info"
            event_data["message"] = 'Job "%s" status has been updated to %s.' % (job_name, job_status)
            event_data["operation"] = 'job_status_update'
            n = Notification.objects.create(**event_data)
            n.save()
            self.retry(countdown=10, kwargs={'current_status': job_status})

        # fire an event that will percolate up to the browser via webosckets


    except ObjectDoesNotExist:
        logger.exception('Unable to locate local user account: %s' % username)

    except HTTPError as e:
        if e.response.status_code == 404:
            logger.warning('Job not found. Cancelling job watch.',
                           extra={'job_id': job_id})
        else:
            logger.warning('Agave API error. Retrying...')
            raise self.retry(exc=e, countdown=60, max_retries=10)

    except AgaveException as e:
        logger.warning('Agave API error. Retrying...')
        raise self.retry(exc=e, countdown=60, max_retries=10)


def index_job_outputs(user, job):
    # ag = user.agave_oauth.client
    # system_id = job['archiveSystem']
    # archive_path = job['archivePath']
    #
    # from designsafe.apps.api.data.agave.filemanager import FileManager as AgaveFileManager
    # mgr = AgaveFileManager(user)
    # mgr.indexer.index(system_id, archive_path, user.username,
    #                   full_indexing = True, pems_indexing = True,
    #                   index_full_path = True)
    pass
