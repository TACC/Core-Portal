"""
.. :module:: apps.accounts.managers.user_systems
   :synopsis: Manager handling anything pertaining to user's home directory and systems
"""

import logging
from django.conf import settings
from portal.apps.accounts.models import SSHKeys
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.utils import encryption as EncryptionUtil
from portal.apps.users.utils import get_user_data
from requests.exceptions import HTTPError
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)


class UserSystemsManager():
    """User Systems Manager
    Any functionality needed to manage a user's home directory and systems
    is implemented here. This is mainly used when setting up a new account
    or to renew keys.

    Systems Config:
    You can find an object of "PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS" in
    settings_default. The systems are indexed by the name of the system
    (ex: frontera). Each object has settings for managing a user's
    storage system.
        'localsystem1': {
            'name': 'My Data (Local System One)', <----------- The name to appear in the "My Data" section.
            'systemId': 'localsystem1.home.{username}', <------- Used to get the system ID for a user
            'host': 'localsystem1.tacc.utexas.edu', <--------- System host
            'rootDir': '/home/{tasdir}', <---------------------- User's home directory
            'port': 22, <----------------------------- System storage port
            'icon': None <------------------------------------ The CSS class name for the icon used in "My Data".
        }

    Default System:
    The "PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT" will be the name of
    one of the systems in "PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS". This system
    will be used when a system is not provided.
    .. seealso::
    :class:`server.portal.apps.search.api.managers.private_data_search.PrivateDataSearchManager`
    """

    def __init__(self, user, system_name=None):
        """Initialize Manager

        :param user: Django user instance
        :param system_name: Name of system to manage, otherwise default system will be used
        """
        self.user = user
        self.tas_user = get_user_data(username=self.user.username)

        if not system_name:
            # if we don't define a default system as a setting we will have to do some crazy
            # iteration over the systems to find the default system... something like
            # next(systems[s] for s in systems if 'default_system' in systems[s])
            default_sys = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
            all_systems = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
            self.system = all_systems[default_sys]
        else:
            try:
                self.system = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS[system_name.lower()]
            except KeyError:
                logger.debug('please provide a valid system name...')
                logger.debug('available systems: {}'.format(list(settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS.keys())))
                return None

    def get_name(self):
        """Gets display name for given system
        :returns: formatted system name
        :rtype: str
        """
        return self.system['name']

    def get_host(self):
        """Gets host for given system
        :returns: system host
        :rtype: str
        """
        return self.system['host']

    def get_system_id(self):
        """Gets system ID for given system and user.

        .. note:: Due to the lack of support for underscores in Tapis v2
        systemIds, we replace underscores in the username with hyphens. Because
        hyphens are not allowed characters in usernames, the resulting
        systemId strings remain unique.

        :returns: unique id for a user's home system. ex: [system].home.[username]
        :rtype: str
        """
        return self.system['systemId'].format(username=self.user.username.replace('_', '-'))

    def get_sys_tas_user_dir(self):
        """Gets path to user's home directory for given system
        :returns: full path for system home directory. ex: "/[home]/[tasid]/[username]"
        :rtype: str
        """
        return self.system['rootDir'].format(tasdir=self.tas_user['homeDirectory'])

    def get_private_directory(self, *args, **kwargs):
        """Gets private storage directory for a user
        :returns: '{tasid}/{username}'
        """
        return self.tas_user['homeDirectory']

    def setup_private_system(self, *args, **kwargs):
        """Create private storage system for a user
        :returns: Agave response
        """
        try:
            private_system = StorageSystem(self.user.tapis_oauth.client, self.get_system_id(), ignore_error=None)
            # If system exists and is disabled, reset with config and enable
            if not private_system.available:
                private_system = self.validate_storage_system(private_system.id)
            return private_system
        except HTTPError as exc:
            if exc.response.status_code == 404:
                private_system = self.validate_storage_system(self.get_system_id())
                return private_system
            else:
                raise

    def validate_storage_system(self, system_id):
        # Check if host keys already exist for user for storage host
        try:
            keys = self.user.ssh_keys.for_hostname(hostname=self.get_host())
            priv_key_str = keys.private_key()
            publ_key_str = keys.public
        except ObjectDoesNotExist:
            private_key = EncryptionUtil.create_private_key()
            priv_key_str = EncryptionUtil.export_key(private_key, 'PEM')
            public_key = EncryptionUtil.create_public_key(private_key)
            publ_key_str = EncryptionUtil.export_key(public_key, 'OpenSSH')

        system = self.get_system_definition(
            publ_key_str,
            priv_key_str
        )

        # Enable a disabled system
        if not system.available:
            system.enable()

        # Save a new system, or update an existing one if it already exists
        try:
            system.save()
        except ValueError:
            system.update()

        # Ensure user is OWNER
        system.update_role(self.user.username, 'OWNER')

        SSHKeys.objects.update_hostname_keys(
            self.user,
            hostname=system.storage.host,
            priv_key=priv_key_str,
            pub_key=publ_key_str
        )
        SSHKeys.objects.update_keys(
            self.user,
            system_id=system.id,
            priv_key=priv_key_str,
            pub_key=publ_key_str
        )
        return system

    def get_system_definition(
            self,
            publ_key_str,
            priv_key_str
    ):
        """Get Agave system definition
        :returns: Agave system definition for provided system
        :rtype: dict
        """
        username = self.user.username
        system = StorageSystem(
            self.user.tapis_oauth.client,
            self.get_system_id()
        )
        system.site = 'portal.dev'
        system.description = 'Home system for user: {username}'.format(
            username=username
        )
        system.name = self.get_system_id()
        system.storage.port = self.system['port']
        system.storage.home_dir = '/'
        system.storage.root_dir = self.get_sys_tas_user_dir()
        system.storage.protocol = 'SFTP'
        system.storage.host = self.get_host()
        system.storage.auth.username = username
        system.storage.auth.type = system.AUTH_TYPES.SSHKEYS
        system.storage.auth.public_key = publ_key_str
        system.storage.auth.private_key = priv_key_str
        return system
