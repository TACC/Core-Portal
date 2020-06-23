from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from requests.auth import HTTPBasicAuth
import requests


class MFAStep(AbstractStep):
    mfa_message = """
        <p>
            Thank you for using TACC. Prior to accessing this portal, your TACC account
            must have multi-factor authentication pairing, using the TACC Token App.
            You may setup your account pairings by viewing your profile at:
        </p>
        <p>
            <a href="https://portal.tacc.utexas.edu/account-profile/-/profile/view" target="_blank">
                https://portal.tacc.utexas.edu/account-profile/-/profile/view
            </a>
        </p>
        <p>
            When you have completed the pairing process, you may click the Confirm
            button in the onboarding page to continue.
        </p>
    """

    def __init__(self, user):
        super(MFAStep, self).__init__(user)

    def display_name(self):
        return "Confirming MFA Pairing"

    def prepare(self):
        self.state = SetupState.PENDING
        self.log(
            "Checking for a multi-factor authentication pairing",

        )

    def mfa_check(self):
        auth = HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
        response = requests.get(self.tas_pairings_url(), auth=auth)
        pairings = response.json()['result']
        return any(pairing['type'] == 'tacc-soft-token' for pairing in pairings)

    def process(self):
        if self.mfa_check():
            self.complete("Multi-factor authentication pairing verified")
        else:
            self.state = SetupState.USERWAIT
            self.log(
                """We were unable to verify your multi-factor authentication pairing. Please try again,
                then click the Confirm button.""",
                data={
                    "more_info": self.mfa_message
                }
            )

    def client_action(self, action, data, request):
        if action == "user_confirm" and request.user.username == self.user.username:
            self.prepare()

    def tas_pairings_url(self):
        return "{0}/tup/users/{1}/pairings".format(settings.TAS_URL, self.user.username);