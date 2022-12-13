import logging
import requests
from requests.exceptions import HTTPError
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from portal.utils.encryption import createKeyPair
from tapipy.errors import BaseTapyException


logger = logging.getLogger(__name__)


def push_system_credentials(user, public_key, private_key, system_id, skipCredentialCheck=False) -> int:
    """
    Set an RSA key pair as the user's auth credential on a Tapis system.
    """
    logger.info(f"Adding user credential for {user.username} to Tapis system {system_id}")
    data = {'privateKey': private_key, 'publicKey': public_key}
    user.tapis_oauth.client.systems.createUserCredential(
        systemId=system_id,
        userName=user.username,
        skipCredentialCheck=skipCredentialCheck,
        **data
    )


class SystemAccessStepV3(AbstractStep):

    def __init__(self, user):
        """
        Call super class constructor
        """
        super(SystemAccessStepV3, self).__init__(user)

    def display_name(self):
        return "System Access"

    def description(self):
        return "Setting up access to TACC storage and execution systems. No action required."

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting TACC systems access.")

    def register_public_key(self, publicKey, system_id) -> int:
        """
        Push a public key to the Key Service API.
        """
        url = "https://api.tacc.utexas.edu/keys/v2/" + self.user.username
        headers = {'Authorization': 'Bearer {}'.format(settings.KEY_SERVICE_TOKEN)}
        data = {'key_value': publicKey, 'tags': [{'name': 'system', 'value': system_id}]}
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status
        return response.status_code

    def check_system(self, system_id) -> None:
        """
        Check whether a user already has access to a storage system by attempting a listing.
        """
        self.user.tapis_oauth.client.files.listFiles(systemId=system_id, path="/")

    def process(self):
        self.log(f"Processing system access for user {self.user.username}")
        for system in self.settings.get('tapis_systems') or []:
            try:
                self.check_system(system)
                self.log(f"Access already granted for system: {system}")
            except BaseTapyException:
                self.log(f"Granting access for system: {system}")

            (priv, pub) = createKeyPair()

            try:
                push_system_credentials(self.user, pub, priv, system)
                self.log(f"Created credentials for system: {system}")
            except BaseTapyException as e:
                self.logger.error(e)
                self.fail(f"Failed to push credentials to system: {system}")

            try:
                self.register_public_key(pub, system)
                self.log(f"Public key registered for system: {system}")
            except HTTPError as e:
                self.logger.error(e)
                self.fail(f"Failed to push public key to key service: {system}")

        if self.state != SetupState.FAILED:
            self.complete("User is processed.")
