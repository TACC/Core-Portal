from portal.apps.users.utils import get_allocations, get_tas_allocations
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def get_user_storage_systems(username, systems):
    """Create list of accessible storage system names for a user

        Returns a list of storage systems a user can access. In
        settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS, each system which
        includes an allocation name in the 'requires_allocation' field will
        be displayed if the user has an allocation for that system.

        :param str username: string username to check allocations for
        :param obj systems: systems object from portal settings
        :returns: filtered object of systems to setup for user
    """
    if not username:
        return {}
    try:
        user_allocations = get_allocations(username)
    except Exception:
        user_allocations = get_tas_allocations(username)

    systems_to_configure = {}
    user_resources = []

    try:
        # get list of user's allocation resources
        for alloc in user_allocations['active'] + user_allocations['inactive']:
            for sys in alloc['systems']:
                user_resources.append(sys['allocation']['resource'].lower())

        # return systems on this portal that user has allocations for
        for sys_name, sys_detail in systems.items():
            required_allocation = sys_detail.get('requires_allocation', None)
            if not required_allocation or (required_allocation and required_allocation in user_resources):
                systems_to_configure[sys_name] = sys_detail
    except Exception as e:
        # In case of error, return the default storage system
        logger.exception(e)
        default_system = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
        systems_to_configure = {
            default_system: systems[default_system]
        }

    return systems_to_configure
