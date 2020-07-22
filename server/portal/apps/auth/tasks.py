from portal.apps.accounts.models import PortalProfile
from celery import shared_task
import logging
from django.contrib.auth import get_user_model
from portal.apps.users.utils import get_user_data, get_allocations

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
    profile.setup_complete = True
    profile.save()
    from portal.apps.accounts.managers.accounts import setup
    for system in systems:
        logger.info("Async setup task for {username} launched on {system}".format(username=username, system=system))
        setup(username, system)

@shared_task(bind=True, max_retries=None)
def check_user_allocations(self, username, systems):
    """Check available allocations for user

        Called synchronously before setup_user from portal.apps.auth.views.agave_oauth_callback
        Check a user's active allocations and return a list of systems to set up based on that
        :param str username: string username to check allocations for
        :param obj systems: systems object from portal settings

        :returns: list of of sysems to setup for user
    """
    tas_blob = get_allocations(username)
    systems_to_configure = []
    user_allocations = []
    conditional_systems = {}

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

    # check that user has allocation for required systems
    for s in conditional_systems:
        if conditional_systems[s]['requires_allocation'] in user_allocations:
            systems_to_configure.append(s)

    return systems_to_configure
