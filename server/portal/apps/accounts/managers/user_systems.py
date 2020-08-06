"""
.. :module:: apps.accounts.managers.user_systems
   :synopsis: Manager handling anything pertaining to user's home directory and systems
"""

import os
import logging
# import requests
from django.conf import settings
from portal.apps.accounts.models import SSHKeys
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.utils import service_account
from portal.utils import encryption as EncryptionUtil
from portal.apps.users.utils import get_user_data
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)


class UserSystemsManager():
    """User Systems Manager
    Any functionality needed to manage a user's home directory and systems
    is implemented here. This is mainly used when setting up a new account
    or to renew keys.

    Systems Config:
    You can find an object of "PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS" in
    settings_secret. The systems are indexed by the name of the system
    (ex: frontera). Each object has settings for managing a user's
    storage system.
        'localsystem1': {
            'name': 'My Data (Local System One)', <----------- The name to appear in the "My Data" section.
            'prefix': 'localsystem1.home.{username}', <------- Used to get the system ID for a user
            'host': 'localsystem1.tacc.utexas.edu', <--------- System host
            'home_directory': '/home', <---------------------- User's home directory
            'relative_path': 'home_dirs', <------------------- User's relative home directory
            'storage_port': 22, <----------------------------- System storage port
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
        :param system_name: name of system to manage otherwise default system will be used
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
        """Gets system ID for given system and user
        :returns: unique id for a user's home system. ex: [system].home.[username]
        :rtype: str
        """
        return self.system['prefix'].format(self.user.username)

    def get_home_dir(self):
        """Gets home directory for given system
        :returns: name of home directory path.
        :rtype: str
        """
        return self.system['home_directory']

    def get_sys_tas_usr_dir(self):
        """Gets path to user's home directory for given system
        :returns: full path for system home directory. ex: "/[home]/[tasid]/[username]"
        :rtype: str
        """
        return os.path.join(
                self.system['home_directory'],
                self.tas_user['homeDirectory'],
            )

    def get_rel_home_dir(self):
        """Gets relative path to home directory for given system
        :returns: relative path for system home directory
        :rtype: str
        """
        return self.system['relative_path']

    def get_private_directory(self, *args, **kwargs):
        """Gets private storage directory for a user
        :returns: '{tasid}/{username}'
        """

        return self.tas_user['homeDirectory']


    def setup_private_system(self, *args, **kwargs):
        """Create private storage system for a user
        :returns: Agave response
        """
        agc = service_account()
        try:
            private_system = agc.systems.get(systemId=self.get_system_id())
            # not sure if we should auto activate a deactivated system...
            # if not private_system['available']:
            #     # set private system to available if it is not.
            #     tenant_base_url = settings.AGAVE_TENANT_BASEURL
            #     token = settings.AGAVE_SUPER_TOKEN
            #     url = "{base}/systems/v2/{system_id}".format(base=tenant_base_url, system_id=self.get_system_id())
            #     headers = {'Authorization': 'Bearer %s' % token}
            #     body = {"action": "enable"}
            #     private_system = requests.put(url, data=body, headers=headers)
            #     return private_system
            #     if response.status_code != 200:
            #         raise
            # else:
            return private_system
        except HTTPError as exc:
            if exc.response.status_code == 404:
                private_key = EncryptionUtil.create_private_key()
                priv_key_str = EncryptionUtil.export_key(private_key, 'PEM')
                public_key = EncryptionUtil.create_public_key(private_key)
                publ_key_str = EncryptionUtil.export_key(public_key, 'OpenSSH')
                private_system = self.get_system_definition(
                    publ_key_str,
                    priv_key_str
                )
                private_system.validate()
                private_system.save()
                private_system.update_role(self.user.username, 'OWNER')
                SSHKeys.objects.save_keys(
                    self.user,
                    system_id=private_system.id,
                    priv_key=priv_key_str,
                    pub_key=publ_key_str
                )
                return private_system
            else:
                raise

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
            service_account(),
            self.get_system_id()
        )
        system.site = 'portal.dev'
        system.description = 'Home system for user: {username}'.format(
            username=username
        )
        system.name = self.get_system_id()
        system.storage.port = self.system['storage_port']
        system.storage.home_dir = '/'
        system.storage.root_dir = self.get_sys_tas_usr_dir()
        system.storage.protocol = 'SFTP'
        system.storage.host = self.get_host()
        system.storage.auth.username = username
        system.storage.auth.type = system.AUTH_TYPES.SSHKEYS
        system.storage.auth.public_key = publ_key_str
        system.storage.auth.private_key = priv_key_str
        return system

    def reset_system_keys(self, *args, **kwargs):
        """Resets home system SSH Keys
        :returns: public key
        :rtype: str
        """
        home_sys = StorageSystem(
            client=self.user.agave_oauth.client,
            id=self.get_system_id()
        )

        private_key = EncryptionUtil.create_private_key()
        priv_key_str = EncryptionUtil.export_key(private_key, 'PEM')
        public_key = EncryptionUtil.create_public_key(private_key)
        publ_key_str = EncryptionUtil.export_key(public_key, 'OpenSSH')

        home_sys.set_storage_keys(
            self.user.username,
            priv_key_str,
            publ_key_str
        )
        try:
            SSHKeys.objects.update_keys(
                self.user,
                system_id=home_sys.id,
                priv_key=priv_key_str,
                pub_key=publ_key_str
            )
        except SSHKeys.DoesNotExist:
            SSHKeys.objects.save_keys(
                self.user,
                system_id=home_sys.id,
                priv_key=priv_key_str,
                pub_key=publ_key_str
            )

        return publ_key_str
