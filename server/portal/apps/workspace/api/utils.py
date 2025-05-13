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


def should_push_keys(system_def: object) -> bool:
    """
    If defaultAuthnMethod is not TMS_KEYS, return true. Otherwise, false.
    """
    return system_def.get("defaultAuthnMethod") != "TMS_KEYS"


def system_credentials_ok(system_id: str, user: object) -> bool:
    """
    Check if user has system credentials on system.
    """
    tapis = user.tapis_oauth.client
    try:
        tapis.systems.checkUserCredential(systemId=system_id, userName=user.username)
    except UnauthorizedError:
        return False
    return True


def test_system_access(system_id: str, user: object) -> bool:
    """
    Test system access by attempting to list files in the root directory.
    """
    tapis = user.tapis_oauth.client
    try:
        tapis.files.listFiles(systemId=system_id, path="/")
    except BaseTapyException:
        return False
    return True


def push_keys_required_if_not_credentials_ensured(system_id: str, user: object) -> bool:
    """
    Check if system credentials are required to be pushed by the user on the system.
    """
    tapis = user.tapis_oauth.client

    if not system_credentials_ok(system_id, user):
        system_def = tapis.systems.getSystem(systemId=system_id)
        if should_push_keys(system_def):
            logger.info(
                "user: %s is missing system credentials and must push keys for system: %s",
                user.username,
                system_id,
            )
            return True

        create_system_credentials(
            tapis, user.username, system_id, createTmsKeys=True
        )

    return False
