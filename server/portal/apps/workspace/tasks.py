from django.contrib.auth import get_user_model
from requests import ConnectionError, HTTPError
import logging

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


def submit_job(request, username, job_post):
    logger.info('Submitting job for user=%s: %s' % (username, job_post))

    try:
        user = get_user_model().objects.get(username=username)
        agave = user.tapis_oauth.client
        response = agave.jobs.submit(body=job_post)
        logger.debug('Job Submission Response: {}'.format(response))

        return response

    except ConnectionError as e:
        logger.error('ConnectionError while submitting job: %s' % e,
                     extra={'job': job_post})
        raise JobSubmitError(status='error',
                             status_code=500,
                             message='We were unable to submit your job at this time due '
                                     'to a Job Service Interruption. Please try again later.')

    except HTTPError as e:
        logger.error('HTTPError while submitting job: %s' % e,
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
