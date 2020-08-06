from portal.apps.accounts.models import PortalProfile
from celery import shared_task
from django.contrib.auth import get_user_model
from portal.apps.users.utils import get_allocations, get_tas_allocations
import json
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=None)
def setup_user(self, username, systems):
    """Setup workflow for each user

        Called asynchronously from portal.apps.auth.views.agave_oauth_callback
        :param str username: string username to setup systems for
        :param dict systems: dict of systems from settings
    """
    user = get_user_model().objects.get(username=username)
    profile = PortalProfile.objects.get(user=user)
    # If this is always set to "True" here, why do check for it in accounts.setup()?
    profile.setup_complete = True
    profile.save()

    system_names = get_user_storage_systems(username, systems)

    from portal.apps.accounts.managers.accounts import setup
    for system in system_names:
        logger.info("Async setup task for {username} launched on {system}".format(username=username, system=system))
        setup(username, system)

def get_user_storage_systems(username, systems):
    """Create list of accessible storage system names for a user

        Returns a list of storage systems a user can access. In
        settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS, each system which
        includes an allocation name in the 'requires_allocation' field will
        be displayed if the user has an allocation for that system.

        :param str username: string username to check allocations for
        :param obj systems: systems object from portal settings
        :returns: list of of systems to setup for user
    """
    try:
        user_allocations = get_allocations(username)
    except:
        user_allocations = get_tas_allocations(username)

    systems_to_configure = []
    user_resources = []

    # get list of user's allocation resources
    for alloc in user_allocations['active'] + user_allocations['inactive']:
        for sys in alloc['systems']:
            user_resources.append(sys['allocation']['resource'].lower())

    # return systems on this portal that user has allocations for
    for sys_name in systems:
        system = systems[sys_name]
        if "requires_allocation" in system and system["requires_allocation"]:
            if system['requires_allocation'] in user_resources:
                systems_to_configure.append(sys_name)
        else:
            systems_to_configure.append(sys_name)

    return systems_to_configure
