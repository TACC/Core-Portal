import logging
import requests
from requests.exceptions import HTTPError
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from django.conf import settings
from portal.utils.encryption import create_private_key, create_public_key, export_key
from tapipy.errors import BaseTapyException


def createKeyPair():
    private_key = create_private_key()
    priv_key_str = export_key(private_key, 'PEM')
    public_key = create_public_key(private_key)
    publ_key_str = export_key(public_key, 'OpenSSH')

    return priv_key_str, publ_key_str


class SystemAccessStepV3(AbstractStep):
    logger = logging.getLogger(__name__)

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

    def push_system_credentials(self, public_key, private_key, system_id) -> int:
        """
        Set an RSA key pair as the user's auth credential on a Tapis system.
        """
        data = {'privateKey': private_key, 'publicKey': public_key}
        self.user.tapis_oauth.client.systems.createUserCredential(
            systemId=system_id,
            userName=self.user.username,
            **data
            )

    def check_system(self, system_id) -> None:
        """
        Check whether a user already has access to a storage system by attempting a listing.
        """
        self.user.tapis_oauth.client.files.listFiles(systemId=system_id, path="/")

    def generate_and_push_credentials(self, system_id):
        (priv, pub) = createKeyPair()
        try:
            self.register_public_key(pub, system_id)
            self.push_system_credentials(pub, priv, system_id)
            self.log(f"Access granted for system: {system_id}")
        except (HTTPError, BaseTapyException) as e:
            self.logger.error(e)
            self.fail(f"Failed to push credentials to system: {system_id}")

    def process(self):
        self.log("Processing system access for user")
        for system in self.settings.get('tapis_systems') or []:
            try:
                self.check_system(system)
                self.log(f"Access already granted for system: {system}")
            except BaseTapyException:
                self.generate_and_push_credentials(system)

        if self.state != SetupState.FAILED:
            self.complete("User is processed.")
