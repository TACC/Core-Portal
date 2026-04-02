import logging
from tapipy.errors import InternalServerError
from portal.apps.notifications.models import Notification
from portal.apps.users.utils import get_user_data
from portal.apps.auth.models import TapisOAuthToken

logger = logging.getLogger(__name__)

NOTIFY_ACTIONS = ["move", "copy", "rename", "trash", "mkdir", "upload", "makepublic"]


def notify(username, operation, status, extra):
    event_data = {
        Notification.EVENT_TYPE: "data_files",
        Notification.STATUS: getattr(Notification, status.upper()),
        Notification.USER: username,
        Notification.EXTRA: extra,
        Notification.OPERATION: operation,
        Notification.READ: True,
    }
    Notification.objects.create(**event_data)


def evaluate_datafiles_storage_system(
    tapis: TapisOAuthToken, system: dict, default_host_eval: str = None
) -> dict:
    """Evaluate storage system homeDir or hostEval for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
        system (dict): Storage system definition
        default_host_eval (str, optional): Default environment variable name to evaluate for homeDir if hostEval is not provided.

    Returns:
        dict: Evaluated storage system definition
    """

    if "homeDir" in system and "{tasdir}" in system["homeDir"]:
        tasdir = get_user_data(tapis.user.username)["homeDirectory"]
        evaluated_system = {
            **system,
            "homeDir": system["homeDir"].format(
                tasdir=tasdir, username=tapis.user.username
            ),
        }
    elif "hostEval" in system or default_host_eval:
        try:
            home_dir = tapis.client.systems.hostEval(
                systemId=system["system"],
                envVarName=system.get("hostEval", default_host_eval),
            ).name
        except InternalServerError:
            # If hostEval fails, return system without evaluation
            return system

        evaluated_system = {
            **system,
            "homeDir": home_dir,
        }
    else:
        evaluated_system = system

    return evaluated_system


def evaluate_datafiles_storage_systems(
    tapis: TapisOAuthToken, systems: list, default_host_eval: str = None
) -> list:
    """Evaluate storage systems homeDir or hostEval for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
        systems (list): List of storage system definitions
        default_host_eval (str, optional): Default environment variable name to evaluate for homeDir if hostEval is not provided.

    Returns:
        list: List of evaluated storage system definitions
    """

    return [
        evaluate_datafiles_storage_system(tapis, system, default_host_eval)
        for system in systems
    ]


def get_user_storage_systems(tapis: TapisOAuthToken) -> list:
    """Get evaluated storage systems for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
    Returns:
        list: List of evaluated storage system definitions
    """
    logger.info("Getting user storage systems for user: %s", tapis.user.username)
    systems = tapis.client.systems.getSystems(
        listType="ALL", limit="-1", select="id,notes", orderBy="id"
    )

    available_systems = [
        {
            "name": system.notes.get("label", system.notes.get("title", system.id)),
            "system": system.id,
            "scheme": "private",
            "api": "tapis",
            "icon": None,
            "default": False,
        }
        for system in systems
    ]

    return evaluate_datafiles_storage_systems(
        tapis, available_systems, default_host_eval="HOME"
    )
