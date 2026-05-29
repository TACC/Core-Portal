import logging
from django.conf import settings
from typing import TypedDict, NotRequired, Optional
from tapipy.errors import InternalServerError, BaseTapyException
from tapipy.tapis import TapisResult
from portal.apps.notifications.models import Notification
from portal.apps.users.utils import get_user_data
from portal.apps.auth.models import TapisOAuthToken

logger = logging.getLogger(__name__)

NOTIFY_ACTIONS = ["move", "copy", "rename", "trash", "mkdir", "upload", "makepublic"]


class PortalDataFilesSystem(TypedDict):
    name: str
    system: str
    scheme: str
    api: str
    homeDir: str
    hostEval: NotRequired[str]
    icon: NotRequired[Optional[str]]
    siteSearchPriority: NotRequired[int]
    resource_provider: NotRequired[str]
    readOnly: NotRequired[bool]
    hideSearchBar: NotRequired[bool]
    integration: NotRequired[bool]


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
    tapis: TapisOAuthToken, system: PortalDataFilesSystem, default_host_eval: str = None
) -> PortalDataFilesSystem:
    """Evaluate storage system homeDir or hostEval for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
        system (PortalDataFilesSystem): Storage system definition
        default_host_eval (str, optional): Default environment variable name to evaluate for homeDir if hostEval is not provided.

    Returns:
        PortalDataFilesSystem: Evaluated storage system definition
    """

    if "homeDir" in system:
        home_dir_vars = {"username": tapis.user.username}
        if "{tasdir}" in system["homeDir"]:
            home_dir_vars["tasdir"] = get_user_data(tapis.user.username)[
                "homeDirectory"
            ]

        evaluated_system = {
            **system,
            "homeDir": system["homeDir"].format(**home_dir_vars),
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

    if "resource_provider" not in system:
        if system["api"] != "tapis":
            # For non-tapis systems without a resource provider, default to "Other"
            evaluated_system["resource_provider"] = "Other"

        elif system["scheme"] == "projects":
            # For projects systems, determine resource provider based on projects host evaluation
            projects_host = settings.PORTAL_PROJECTS_ROOT_HOST
            evaluated_system["resource_provider"] = _get_resource_provider_from_host(
                projects_host
            )
        else:
            system_def = tapis.client.systems.getSystem(systemId=system["system"])
            evaluated_system["resource_provider"] = _get_resource_provider_from_system(
                system_def
            )

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

    evaluated_systems = []
    for system in systems:
        try:
            evaluated_systems.append(
                evaluate_datafiles_storage_system(tapis, system, default_host_eval)
            )
        except (BaseTapyException, KeyError, AttributeError):
            logger.exception(
                "Error evaluating storage system %s for user %s",
                system["system"],
                tapis.user.username,
            )
    return evaluated_systems


def get_user_storage_systems(tapis: TapisOAuthToken) -> list:
    """Get evaluated storage systems for user

    Args:
        tapis (TapisOAuthToken): Tapis OAuth token object
    Returns:
        list: List of evaluated storage system definitions
    """
    logger.info("Getting user storage systems for user: %s", tapis.user.username)
    systems = tapis.client.systems.getSystems(
        listType="ALL", limit="-1", select="id,notes,host", orderBy="id"
    )

    available_systems = [
        {
            "name": system.notes.get("label", system.notes.get("title", system.id)),
            "system": system.id,
            "scheme": "private",
            "api": "tapis",
            "icon": None,
            "default": False,
            "resource_provider": _get_resource_provider_from_system(system),
        }
        for system in systems
    ]

    return evaluate_datafiles_storage_systems(
        tapis, available_systems, default_host_eval="HOME"
    )


def _get_resource_provider_from_system(system: TapisResult) -> str:
    """Get resource provider from a Tapis system's notes or via hostname evaluation"""
    resource_provider = system.notes.get("resource_provider")

    return resource_provider or _get_resource_provider_from_host(system.host)


def _get_resource_provider_from_host(host: str) -> str:
    """Get resource provider from hostname evaluation of a Tapis system"""
    if host.endswith(".tacc.utexas.edu"):
        return "TACC Systems"
    if host.endswith(".edu"):
        return host.split(".")[-2].upper()

    return "Other"
