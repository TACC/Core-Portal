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
    # HERE
    from portal.apps.accounts.managers.accounts import setup
    for system in systems:
        logger.info("Async setup task for {username} launched on {system}".format(username=username, system=system))
        setup(username, system)

@shared_task(bind=True, max_retries=None)
def check_user_allocations(self, username, systems):
    """Check and update available allocations for user

        This will update a user's profile with their active allocations and return a list
        of systems for account setup. Called synchronously before setup_user from
        portal.apps.auth.views.agave_oauth_callback
        :param str username: string username to check allocations for
        :param obj systems: systems object from portal settings

        :returns: list of of sysems to setup for user
    """
    tas_blob = get_allocations(username) #runs when user hits allocations
    systems_to_configure = []
    user_allocations = []
    conditional_systems = {}

    # save active allocations to user profile
    user = get_user_model().objects.get(username=username)
    profile = PortalProfile.objects.get(user=user)

    # get conditionally configured systems
    for sys_name in systems:
        if systems[sys_name]['requires_allocation']:
            conditional_systems[sys_name] = systems[sys_name]
        else:
            systems_to_configure.append(sys_name)

    # get active user allocations
    for active_alloc in tas_blob['active']:
        for sys in active_alloc['systems']:
            user_allocations.append(sys['allocation']['resource'].lower())

    # check user has allocations for required systems
    for sys_name in conditional_systems:
        if conditional_systems[sys_name]['requires_allocation'] in user_allocations:
            systems_to_configure.append(sys_name)

    # store tas allocation data
    profile.active_systems = json.dumps(systems_to_configure)
    profile.active_allocations = json.dumps(tas_blob['active'])
    profile.inactive_allocations = json.dumps(tas_blob['inactive'])
    profile.save()
    return systems_to_configure
