import logging
from portal.apps.onboarding.steps.abstract import AbstractStep
from portal.apps.onboarding.state import SetupState
from portal.libs.agave.utils import service_account
from tapipy.errors import BaseTapyException
from portal.utils.encryption import createKeyPair

logger = logging.getLogger(__name__)


def create_system_credentials_with_keys(client,
                                        username,
                                        public_key,
                                        private_key,
                                        system_id,
                                        skipCredentialCheck=False) -> int:
    """
    Set an RSA key pair as the user's auth credential on a Tapis system.
    """
    logger.info(f"Creating user credential for {username} on Tapis system {system_id} using keys")
    data = {'privateKey': private_key, 'publicKey': public_key}
    client.systems.createUserCredential(
        systemId=system_id,
        userName=username,
        skipCredentialCheck=skipCredentialCheck,
        **data
    )


def create_system_credentials(client,
                              username,
                              system_id,
                              createTmsKeys,
                              skipCredentialCheck=False) -> int:
    """
    Create user's auth credential on a Tapis system. This Tapis API uses TMS.
    """
    logger.info(f"Creating user credential for {username} on Tapis system {system_id} using TMS")
    client.systems.createUserCredential(
        systemId=system_id,
        userName=username,
        createTmsKeys=createTmsKeys,
        skipCredentialCheck=skipCredentialCheck,
    )


def set_user_permissions(user, system_id):
    """Apply read/write/execute permissions to files and read permissions on the system."""
    logger.info(f"Adding {user.username} permissions to Tapis system {system_id}")
    client = service_account()
    client.systems.grantUserPerms(
        systemId=system_id,
        userName=user.username,
        permissions=['READ'])
    client.files.grantPermissions(
        systemId=system_id,
        path="/",
        username=user.username,
        permission='MODIFY'
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

    def get_system(self, system_id) -> None:
        """
        Get the system definition
        """
        return self.user.tapis_oauth.client.systems.getSystem(systemId=system_id)

    def check_system(self, system_id) -> None:
        """
        Check whether a user already has access to a storage system by attempting a listing.
        """
        self.user.tapis_oauth.client.files.listFiles(systemId=system_id, path="/")

    def process(self):
        self.log(f"Processing system access for user {self.user.username}")
        for system in self.settings.get('access_systems') or []:
            try:
                set_user_permissions(self.user, system)
                self.log(f"Successfully granted permissions for system: {system}")
            except BaseTapyException as e:
                logger.error(e)
                self.fail(f"Failed to grant permissions for system: {system}")

        for system in self.settings.get('credentials_systems') or []:
            try:
                self.check_system(system)
                self.log(f"Credentials already created for system: {system}")
                continue
            except BaseTapyException:
                self.log(f"Creating credentials for system: {system}")

            system_definition = self.get_system(system)
            try:
                if system_definition.get("defaultAuthnMethod") != 'TMS_KEYS':
                    (priv, pub) = createKeyPair()
                    create_system_credentials_with_keys(
                        self.user.tapis_oauth.client, self.user.username, pub, priv, system
                    )
                else:
                    create_system_credentials(
                        self.user.tapis_oauth.client, self.user.username, system, createTmsKeys=True
                    )
                self.log(f"Successfully created credentials for system: {system}")
            except BaseTapyException as e:
                logger.error(e)
                self.fail(f"Failed to create credentials for system: {system}")

        if self.state != SetupState.FAILED:
            self.complete("User is processed.")
