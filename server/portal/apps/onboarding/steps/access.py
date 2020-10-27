from portal.apps.onboarding.state import SetupState
from portal.apps.onboarding.steps.abstract import AbstractStep


class RequestAccessStep(AbstractStep):
    def __init__(self, user):
        """
        Call super class constructor
        """
        super(RequestAccessStep, self).__init__(user)

    def display_name(self):
        return "Requesting Access"

    def description(self):
        return """This notifies a system administrator of your request 
               to access the portal. After sending the request, wait for their approval."""

    def prepare(self):
        super(RequestAccessStep, self).prepare()
        self.state = SetupState.STAFFWAIT
        self.log("Please wait for your access request to be approved.")

    def client_action(self, action, data, request):
        if not request.user.is_staff:
            return

        if action == "staff_approve":
            self.complete(
                "Portal access request approved by {user}".format(
                    user=request.user.username
                )
            )
        elif action == "staff_deny":
            self.fail(
                "Portal access request has not been approved."
            )
        else:
            self.fail(
                "Invalid client action {action}".format(
                    action=action
                )
            )
