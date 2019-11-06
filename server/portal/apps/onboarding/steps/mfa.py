from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState

class MFAStep(AbstractStep):
    """
    Non functional

    Example of how to create a setup state that requires user intervention
    When user clicks "Confirm" through portal, process() will be triggered
    """
    def __init__(self, user):
        super(MFAStep, self).__init__(user)

    def display_name(self):
        return "Confirming MFA Pairing"

    def prepare(self):
        self.state = SetupState.USERWAIT
        self.log("Please setup your multi-factor authentication through the TACC User Portal at portal.tacc.utexas.edu")

    
    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user.username == self.user.username:
            # Actually do TAS MFA check here
            mfa_paired = True
            if mfa_paired:
                self.complete("Multi-factor authentication pairing verified")
            else:
                self.log("We were unable to verify your multi-factor authentication pairing. Please try again.")
