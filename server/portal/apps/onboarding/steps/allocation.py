from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from portal.apps.users.utils import get_allocations
import string

class AllocationStep(AbstractStep):
    def __init__(self, user):
        """
        Call super class constructor
        """
        super(AllocationStep, self).__init__(user)

    def display_name(self):
        return "Checking Allocations"

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting allocation check")

    def process(self):
        # Get "ALLOCATION_SYSTEMS" setting
        # This setting should be a list that specifies which
        # systems fulfill the requirement. A user should have at least
        # one of these systems.

        # TODO: This should be stored in proposed LiveSettings
        systems = getattr(settings, 'ALLOCATION_SYSTEMS', [])

        # If the setting does not exist, we will assume that
        # no systems are required and their allocation check is verified
        if len(systems) == 0:
            self.complete("No systems are required for access to this portal")
            return

        resources = [ ]
        try:
            resources = get_allocations(self.user.username).keys()
        except:
            self.state = SetupState.ERROR
            self.log("Unable to retrieve a list of projects")

        # If the intersection of the set of systems and resources has items,
        # the user has the necessary allocation
        has_alloc = len(set(systems).intersection(resources)) > 0

        if has_alloc:
            self.complete("You have the required systems for accessing this portal")
        else:
            self.fail("You must have a project allocation with one of the required systems for this portal.")