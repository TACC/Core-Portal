from portal.apps.notifications.models import Notification
from portal.apps.users.utils import get_user_data
from portal.apps.auth.models import TapisOAuthToken

NOTIFY_ACTIONS = ['move',
                  'copy',
                  'rename',
                  'trash',
                  'mkdir',
                  'upload',
                  'makepublic']


def notify(username, operation, status, extra):
    event_data = {
        Notification.EVENT_TYPE: 'data_files',
        Notification.STATUS: getattr(Notification, status.upper()),
        Notification.USER: username,
        Notification.EXTRA: extra,
        Notification.OPERATION: operation,
        Notification.READ: True
    }
    Notification.objects.create(**event_data)


def evaluate_datafiles_storage_system(tapis: TapisOAuthToken, system: dict) -> dict:
    """Evaluate storage system homeDir or hostEval for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
        system (dict): Storage system definition

    Returns:
        dict: Evaluated storage system definition
    """

    if "homeDir" in system:
        tasdir = get_user_data(tapis.user.username)["homeDirectory"]
        evaluated_system = {
            **system,
            "homeDir": system["homeDir"].format(
                tasdir=tasdir, username=tapis.user.username
            ),
        }
    elif "hostEval" in system:
        evaluated_system = {
            **system,
            "homeDir": tapis.client.systems.hostEval(
                systemId=system["system"], envVarName=system["hostEval"]
            ).name,
        }
    else:
        evaluated_system = system

    return evaluated_system


def evaluate_datafiles_storage_systems(tapis: TapisOAuthToken, systems: list) -> list:
    """Evaluate storage systems homeDir or hostEval for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
        systems (list): List of storage system definitions

    Returns:
        list: List of evaluated storage system definitions
    """

    return [evaluate_datafiles_storage_system(tapis, system) for system in systems]
