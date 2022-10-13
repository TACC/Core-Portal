
from requests.exceptions import HTTPError
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
import requests
from django.conf import settings
from portal.utils.encryption import create_private_key, create_public_key, export_key
from tapipy.errors import BaseTapyException
from portal.apps.onboarding.state import SetupState
import logging


def formatKeys(privateKey, publicKey):
    """Replace newline characters with a literal \n"""
    #publicKey = publicKey.replace("\n", "\\n")
    #privateKey = privateKey.replace("\n", "\\n")
    return privateKey, publicKey


def createKeyPair():
    private_key = create_private_key()
    priv_key_str = export_key(private_key, 'PEM')
    public_key = create_public_key(private_key)
    publ_key_str = export_key(public_key, 'OpenSSH')

    return formatKeys(priv_key_str, publ_key_str)


class SystemAccessStepV3(AbstractStep):
    logger = logging.getLogger(__name__)

    def __init__(self, user):
        """
        Call super class constructor
        """
        super(SystemAccessStepV3, self).__init__(user)

    def display_name(self):
        return "Storage"

    def description(self):
        return "Setting up access to data files on the storage systems (V3). No action required."

    def prepare(self):
        self.state = SetupState.PENDING
        self.log("Awaiting storage system access (V3)")

    def register_public_key(self, publicKey, system_id) -> int:
        """
        Push a public key to the Key Service API.
        """
        url = "https://api.tacc.utexas.edu/keys/v2/" + self.user.username
        headers = {'Authorization': 'Bearer {}'.format(settings.KEY_SERVICE_TOKEN)}
        data = {'key_value': publicKey, 'tags': [{'name': 'system', 'value': system_id}]}
        response = requests.post(url, json=data, headers=headers)
        print("Key service post data: {}".format(data))
        print("Key service response {}: {}".format(response.status_code, response.content))
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
        except (HTTPError, BaseTapyException) as e:
            self.logger.error(e)
            self.fail(f"Failed to push credentials to system: {system_id}")

    def process(self):
        self.log("processing user")
        for storage in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS:
            try:
                self.check_system(storage['system'])
                self.log(f"Access already granted for system: {storage['system']}")
            except BaseTapyException:
                self.generate_and_push_credentials(storage['system'])

        if self.state != SetupState.FAILED:
            self.complete("user is processed.")
