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
        :param list systems: list of string system names to setup for user
    """
    user = get_user_model().objects.get(username=username)
    profile = PortalProfile.objects.get(user=user)
    # If this is always set to "True" here, why do check for it in accounts.setup()?
    profile.setup_complete = True
    profile.save()

    from portal.apps.accounts.managers.accounts import setup
    for system in systems:
        logger.info("Async setup task for {username} launched on {system}".format(username=username, system=system))
        setup(username, system)

@shared_task(bind=True, max_retries=None)
def check_user_allocations(self, username, systems):
    """Create list of accessible storage systems for a user

        Returns a list of storage systems a user can access. In
        settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS each system which
        includes an allocation name in the 'requires_allocation' field will
        be displayed if the user has an allocation for that system. If the
        'requires_allocation' field is None it will always be returned. Called
        synchronously before setup_user from
        portal.apps.auth.views.agave_oauth_callback

        :param str username: string username to check allocations for
        :param obj systems: systems object from portal settings
        :returns: list of of sysems to setup for user
    """
    tas_info = get_allocations(username)
    systems_to_configure = []
    user_allocations = []
    conditional_systems = {}

    # get list of conditionally configured systems
    for sys_name in systems:
        if systems[sys_name]['requires_allocation']:
            conditional_systems[sys_name] = systems[sys_name]
        else:
            systems_to_configure.append(sys_name)

    # get list of user's allocations
    for alloc in tas_info['active'] + tas_info['inactive']:
        for sys in alloc['systems']:
            user_allocations.append(sys['allocation']['resource'].lower())

    # check for 
    for sys_name in conditional_systems:
        if conditional_systems[sys_name]['requires_allocation'] in user_allocations:
            systems_to_configure.append(sys_name)

    return systems_to_configure
