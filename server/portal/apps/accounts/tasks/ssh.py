"""
.. :module:: apps.accounts.tasks.ssh
   :synopsis: Tasks related to user accounts
"""

import logging
from celery import shared_task
from celery.result import AsyncResult

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


@shared_task(
    max_retries=None,
    time_limit=60*5,  # 60s * 5 = 5min
    track_started=True
)  # pylint: disable=too-many-arguments
def setup_pub_key(
        user,
        password,
        token,
        system_id,
        hostname,
        port
):
    """Setup public keys for user"""
    from portal.apps.accounts.managers import accounts as AccountsManager
    output = AccountsManager.add_pub_key_to_resource(
        user,
        password,
        token,
        system_id,
        hostname,
        port
    )
    return output


@shared_task(bind=True)
def monitor_setup_pub_key(self, task_id):
    """Monitors Setup Pub Key

    Monitors :func:~setup_pub_key` task.
    This task should send events to the frontend
    letting the user know what is going on with
    setting up the public key
    """
    result = AsyncResult(task_id)
    if not result.ready():
        self.retry(
            exc=Exception('Monitored task not done yet. Retrying')
        )

    if result.state == 'FAILURE':
        logger.info('TASK FAILED')
        logger.debug(result.result)
    elif result.state == 'SUCCESS':
        logger.info('TASK SUCCESSFUL')
        logger.debug(result.result)
