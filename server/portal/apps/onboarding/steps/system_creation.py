from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from portal.apps.search.tasks import index_allocations
from portal.apps.auth.tasks import setup_user, get_user_storage_systems
from django.conf import settings
import logging


class SystemCreationStep(AbstractStep):
    logger = logging.getLogger(__name__)

    def __init__(self, user):
        """
        Call super class constructor
        """
        super(SystemCreationStep, self).__init__(user)

    def display_name(self):
        return "Storage"

    def description(self):
        return """	Setting up access to data files on the storage systems. No action required."""

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting storage system creation")

    def process(self):
        self.log("Setting up storage systems")
        index_allocations(self.user.username)
        system_names = get_user_storage_systems(
            self.user.username, settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
        )
        for system in system_names:
            self.log("Setting up system {}".format(system))
            setup_user(self.user.username, system)
        self.complete("Finished setting up storage systems")
