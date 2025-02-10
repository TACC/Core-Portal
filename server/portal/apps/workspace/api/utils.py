from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials
from tapipy.errors import BaseTapyException
import json
import logging

logger = logging.getLogger(__name__)


def get_tapis_timeout_error_messages(job_id):
    return [
        'JOBS_EARLY_TERMINATION Job terminated by Tapis because: TIME_EXPIRED',
        f'JOBS_USER_APP_FAILURE The user application ({job_id}) ended with remote status "TIMEOUT" and returned exit code: 0:0.'
    ]


def check_job_for_timeout(job):
    """
    Check an interactive job for timeout status and mark it as finished
    since Tapis does not have native support for interactive jobs yet
    """

    if (hasattr(job, 'notes')):
        notes = json.loads(job.notes)

        is_failed = job.status == 'FAILED'
        is_interactive = notes.get('isInteractive', False)
        has_timeout_message = job.lastMessage in get_tapis_timeout_error_messages(job.remoteJobId)

        if is_failed and is_interactive and has_timeout_message:
            job.status = 'FINISHED'
            job.remoteOutcome = 'FINISHED'

    return job


def should_push_keys(system):
    """
    If defaultAuthnMethod is not TMS_KEYS, return true. Otherwise, false.
    """
    return system.get("defaultAuthnMethod") != 'TMS_KEYS'


def test_system_credentials(system, user):
    """
    If system does not support TMS, create keys and
    tapis system credentials using keys, otherwise create
    credentials with TMS.
    """
    # TODOv3: Add Tapis system test utility method with proper error handling https://tacc-main.atlassian.net/browse/WP-101
    tapis = user.tapis_oauth.client
    if should_push_keys(system):
        return False
    else:
        try:
            create_system_credentials(user.tapis_oauth.client, user.username, system.id, createTmsKeys=True)
            tapis.files.listFiles(systemId=system.id, path="/")
        except BaseTapyException:
            return False

    return True
