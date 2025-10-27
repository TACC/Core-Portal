"""Utility functions for workspace API operations."""

import json
import logging
from typing import Union
from tapipy.tapis import TapisResult
from tapipy.errors import BaseTapyException, UnauthorizedError
from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials
from portal.exceptions.api import ApiException

logger = logging.getLogger(__name__)


def get_tapis_timeout_error_messages(job_id):
    return [
        "JOBS_EARLY_TERMINATION Job terminated by Tapis because: TIME_EXPIRED",
        f'JOBS_USER_APP_FAILURE The user application ({job_id}) ended with remote status "TIMEOUT" and returned exit code: 0:0.',
    ]


def _get_job_notes(job_notes: Union[str, TapisResult]):
    """
    Normalize `job.notes` as in older version of Tapis `notes` is a JSON-formatted string
    but this is being changed to a TapisResult object. Once all tenants are migrated to
    return structured (non-string) 'notes', this can be
    removed
    """
    if isinstance(job_notes, str):
        return json.loads(job_notes)
    return job_notes


def check_job_for_timeout(job):
    """
    Check an interactive job for timeout status and mark it as finished
    since Tapis does not have native support for interactive jobs yet
    """

    if hasattr(job, "notes"):
        notes = _get_job_notes(job.notes)

        is_failed = job.status == "FAILED"
        is_interactive = notes.get("isInteractive", False)
        has_timeout_message = job.lastMessage in get_tapis_timeout_error_messages(
            job.remoteJobId
        )

        if is_failed and is_interactive and has_timeout_message:
            job.status = "FINISHED"
            job.remoteOutcome = "FINISHED"

    return job


def is_tms_system(system_def: object) -> bool:
    """
    Check if the system is a TMS system.
    """
    return system_def.get("defaultAuthnMethod") == "TMS_KEYS"


def should_push_keys(system_def: object, username) -> bool:
    """
    If defaultAuthnMethod is not TMS_KEYS, return true. Otherwise, false.
    """
    return (not is_tms_system(system_def)) and (
        system_def.get("effectiveUserId") == username
    )


def system_credentials_ok(user: object, system_id: str, path: str = "/") -> bool:
    """
    Check if user has system credentials on system.
    """
    tapis = user.tapis_oauth.client
    try:
        tapis.systems.checkUserCredential(systemId=system_id, userName=user.username)
        return True
    except UnauthorizedError:
        # If a system does not have a static effectiveUserId, it may not have a user credential.
        # In this case, we can test access to the system with a file listing.
        return test_system_access_ok(user, system_id, path)


def test_system_access_ok(user: object, system_id: str, path: str = "/") -> bool:
    """
    Test system access by attempting to list files in the root directory.
    """
    tapis = user.tapis_oauth.client
    try:
        tapis.files.listFiles(systemId=system_id, path=path, limit=1)
        return True
    except UnauthorizedError:
        return False
    except BaseTapyException as e:
        logger.exception(
            "System access check failed for user: %s on system: %s",
            user.username,
            system_id,
        )
        raise e


def push_keys_required_if_not_credentials_ensured(
    user: object, system_id: str, path: str = "/"
) -> bool:
    """
    Check if system credentials are required to be pushed by the user on the system, or attempt
    to create credentials if they are not present.
    """
    tapis = user.tapis_oauth.client

    if not system_credentials_ok(user, system_id, path):
        logger.info(
            "user: %s is missing system credentials on system: %s",
            user.username,
            system_id,
        )
        system_def = tapis.systems.getSystem(systemId=system_id)
        if should_push_keys(system_def, user.username):
            logger.info(
                "user: %s is missing system credentials and must push keys for system: %s",
                user.username,
                system_id,
            )
            return True

        if is_tms_system(system_def):
            create_system_credentials(
                tapis, user.username, system_id, createTmsKeys=True
            )
        else:
            raise ApiException(
                f"User {user.username} does not have system credentials and \
                    cannot push keys or create credentials for system {system_id}."
            )

    return False
