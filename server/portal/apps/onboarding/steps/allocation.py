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
        return "Allocations"

    def description(self):
        return """Accessing your allocations. If unsuccessful, verify the PI has added you to the allocations for this project."""

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting allocation retrieval")

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user.username == self.user.username:
            self.prepare()

    def process(self):
        self.state = SetupState.PROCESSING
        self.log("Retrieving your allocations")
        # Force allocation retrieval from TAS and refresh elasticsearch
        allocations = get_allocations(self.user.username, force=True)
        if not allocations.get("active"):
            self.state = SetupState.FAILED
            self.log(
                """User {0} does not have any allocations""".format(self.user.username),
            )
        else:
            if "expected_hosts" in self.settings:
                # checking if expected hosts are included in allocation hosts
                expected_hosts = self.settings["expected_hosts"]
                allocation_hosts = {h.lower() for h in allocations["hosts"].keys()}
                matched_hosts = [h for h in expected_hosts if h in allocation_hosts]
                missing_hosts = [h for h in expected_hosts if h not in allocation_hosts]

                if missing_hosts:
                    self.state = SetupState.FAILED
                    self.log(
                        "User {0} is missing allocations on: {1}".format(
                            self.user.username, missing_hosts
                        )
                    )
                    return
                self.log("Expected host allocations found: {0}".format(matched_hosts))

            self.complete("Allocations retrieved", data=allocations)
