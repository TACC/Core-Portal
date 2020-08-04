from portal.apps.accounts.models import PortalProfile
from celery import shared_task
from django.contrib.auth import get_user_model
from portal.apps.users.utils import get_user_data, get_allocations
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

    system_names = check_user_allocations(username, systems)

    from portal.apps.accounts.managers.accounts import setup
    for system in system_names:
        logger.info("Async setup task for {username} launched on {system}".format(username=username, system=system))
        setup(username, system)

def check_user_allocations(username, systems):
    """Create list of accessible storage systems for a user

        Returns a list of storage systems a user can access. In
        settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS, each system which
        includes an allocation name in the 'requires_allocation' field will
        be displayed if the user has an allocation for that system.

        :param str username: string username to check allocations for
        :param obj systems: systems object from portal settings
        :returns: list of of sysems to setup for user
    """
    tas_info = get_allocations(username)
    systems_to_configure = []
    user_allocations = []

    # get list of user's allocation resources
    for alloc in tas_info['active'] + tas_info['inactive']:
        for sys in alloc['systems']:
            user_allocations.append(sys['allocation']['resource'].lower())

    # return systems on this portal that user has allocations for
    for sys_name in systems:
        if "requires_allocation" in systems[sys_name]:
            if systems[sys_name]['requires_allocation'] in user_allocations:
                systems_to_configure.append(sys_name)
        else:
            systems_to_configure.append(sys_name)

    return systems_to_configure
