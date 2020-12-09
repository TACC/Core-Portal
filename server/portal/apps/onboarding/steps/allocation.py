from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from portal.apps.users.utils import get_allocations


class AllocationStep(AbstractStep):
    def __init__(self, user):
        """
        Call super class constructor
        """
        super(AllocationStep, self).__init__(user)

    def display_name(self):
        return "Retrieving Allocations"

    def description(self):
        return """This retrieves a list of allocations on TACC HPC systems. After
               we retrieve this information, we will set up access to these systems."""

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting allocation retrieval")

    def process(self):
        self.state = SetupState.PROCESSING
        self.log("Retrieving your allocations")
        # Force allocation retrieval from TAS and refresh elasticsearch
        allocations = get_allocations(self.user.username, force=True)
        self.complete("Allocations retrieved", data=allocations)
