from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials
from tapipy.errors import BaseTapyException, UnauthorizedError
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


def ensure_system_credentials(system_id, user):
    """
    Attempt to create system credentials for user on system if no credentials exist.
    """
    tapis = user.tapis_oauth.client

    try:
        tapis.systems.checkUserCredential(systemId=system_id, userName=user.username)
    except UnauthorizedError:
        create_system_credentials(tapis, user.username, system_id, createTmsKeys=True)


def test_system_access(system_id, user):
    """
    Test system access by attempting to list files in the root directory.
    """
    tapis = user.tapis_oauth.client
    try:
        tapis.files.listFiles(systemId=system_id, path="/")
    except BaseTapyException:
        return False
