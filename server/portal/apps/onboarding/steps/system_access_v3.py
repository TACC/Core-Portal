
from requests.exceptions import HTTPError
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
import requests
from Crypto.PublicKey import RSA
from django.conf import settings
import logging

"""
.. :module:: portal.utils.encryption
   :synopsis: Utilities to handle encryption and ssh keys
"""


def create_private_key(bits=2048):
    """Creates a brand new RSA key

    :param int bits: Key bits
    """
    key = RSA.generate(bits)
    return key


def create_public_key(key):
    """Returns public key

    :param key: RSA key
    """
    pub_key = key.publickey()
    return pub_key


def export_key(key, format='PEM'):  # pylint: disable=redefined-builtin
    """Exports private key

    :param key: RSA key
    :param str format: Format to export key

    .. note::
        Use `format='PEM'` for exporting private keys
        and `format='OpenSSH' for exporting public keys
    """
    return key.exportKey(format).decode('utf-8')


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
        credentials_endpoint = f"{settings.TAPIS_TENANT_BASEURL}/v3/systems/credential/{system_id}/user/{self.user.username}"
        headers = {'X-Tapis-Token': self.user.tapis_oauth.access_token}
        data = {'privateKey': private_key, 'publicKey': public_key}
        response = requests.post(credentials_endpoint, headers=headers, json=data)
        response.raise_for_status()
        return response.status_code

    def check_system(self, system_id) -> None:
        """
        Check whether a user already has access to a storage system by attempting a listing.
        """
        headers = {'X-Tapis-Token': self.user.tapis_oauth.access_token}
        check_endpoint = f"{settings.TAPIS_TENANT_BASEURL}/v3/files/ops/{system_id}/"
        response = requests.get(check_endpoint, headers=headers)
        response.raise_for_status()

    def generate_and_push_credentials(self, system_id):
        (priv, pub) = createKeyPair()
        try:
            self.register_public_key(pub, system_id)
            self.push_system_credentials(pub, priv, system_id)
        except HTTPError as e:
            self.logger.error(e)
            self.fail(f"Failed to push credentials to system: {system_id}")

    def process(self):
        self.log("processing user")
        self.complete("user is processed.")
        for storage in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS:
            try:
                self.check_system(storage['system'])
                self.log(f"Access already granted for system: {storage['system']}")
            except HTTPError:
                self.generate_and_push_credentials(storage['system'])

