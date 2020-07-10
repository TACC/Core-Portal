"""
.. :module:: apps.accounts.managers.user_systems
   :synopsis: Manager handling anything pertaining to user's home directory and systems
"""

import os
import logging
from django.conf import settings
from portal.apps.accounts.models import SSHKeys
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.utils import service_account
from portal.utils import encryption as EncryptionUtil
from pytas.http import TASClient
from pytas.models.users import User as TASUser
from requests.exceptions import HTTPError

logger = logging.getLogger(__name__)

# Need to make some big changes here.
# Consider changing removing/changing some of the secrets to hold configurables to return user
# related settings such as the user's **home directory** on a specefic storage system...
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
            'abs_home_directory': '/path/to/home_dirs/', <---- User's absolute home directory path
            'home_directory': '/home', <---------------------- User's home directory
            'relative_path': 'home_dirs', <------------------- User's relative home directory
            'icon': None <------------------------------------ The CSS class for the icon used in "My Data".
        }

    Default System:
    The "PORTAL_DATA_DEPOT_DEFAULT_LOCAL_STORAGE_SYSTEM" will be the name of
    one of the systems in "PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS". This system
    will be used when a system is not provided.
    .. seealso::
    :class:`server.portal.apps.search.api.managers.private_data_search.PrivateDataSearchManager`
    """

    def __init__(
        self,
        user,
        system_name=settings.PORTAL_DATA_DEPOT_DEFAULT_LOCAL_STORAGE_SYSTEM,
        use_work=False
    ):
        """Initialize Manager

        :param user: Django user instance
        :param system_name: name of system to manage otherwise use default system
        :param use_work: if True initialize tas_user
        """
        self.user = user

        try:
            self.system = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS[system_name.lower()]
        except KeyError:
            logger.debug('please provide a valid system name...')
            logger.debug('available systems: {}'.format(list(settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS.keys())))
            return None

        # refactor this tas_client stuff...
        # maybe make this into its own portal.libs function or something
        # this will be important later if TAS gets an upgrade and we need it 
        # changed everywhere that uses it. Also, maybe we should bring up
        # weather or not any portal from now on should have its own virtual
        # MyData spaces on corral. I don't think they should for several reasons
        #  - JChuah
        if use_work:
            self.tas_client = TASClient(
                baseURL=settings.TAS_URL,
                credentials={
                    'username': settings.TAS_CLIENT_KEY,
                    'password': settings.TAS_CLIENT_SECRET
                }
            )
            self.tas_user = self.tas_client.get_user(username=self.user.username)

    # Refactor... do not use 'storage_system': 'frontera.storage.default'
    # (previously: AGAVE_STORAGE_SYSTEM) in anything!!!
    # This does not work for /work or /home1 based storage systems...
    # currently uses {system}.storage.default
    # needs to use {system}.storage.{username}
    def get_dir(self, *args, **kwargs):
        """Gets user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        agc = service_account()
        username = self.user.username
        home_dir = agc.files.list(
            systemId=self.system['home_directory'],
            filePath=username)
        # need to return:
        # system['home_directory'] + {id} + {username}
        # ex: /home1/12345/keiths/
        return home_dir

    # this and get_dir should be merged and refactored
    # Can this function be repurposed instead to support different
    # PORTAL_STORAGE_SYSTEMS that may require a virtual home? if
    # that's what we want to support. if not, we should probably
    # get rid of this "get_or_create" business. The whole point of
    # get_or_create is to trigger a possible side effect of creating
    # a directory on behalf of the user, and it makes tracing what's
    # actually happening on the HPC side difficult.
    # - JChuah
    def get_or_create_dir(self, *args, **kwargs):
        """Gets or creates user's home directory

        :param user: User instance

        :returns: Agave response for the folder

        .. note::
            We do not need to create the directory instead we check we
            have a value in
            `homeDirectory` from `TAS`
        """
        path = self.tas_user['homeDirectory']
        assert self.tas_user
        assert self.user.username in path
        return path

    def _save_user_keys(
            self,
            user,
            system_id,
            priv_key,
            pub_key
    ):  # pylint:disable=no-self-use
        """Saves a user's ssh keys for a specific system

        :param user: Django user instance
        :param str priv_key: Private Key
        :param str pub_key: Public Key
        """
        SSHKeys.objects.save_keys(
            user,
            system_id=system_id,
            priv_key=priv_key,
            pub_key=pub_key
        )

    def _update_user_keys(
            self,
            user,
            system_id,
            priv_key,
            pub_key
    ):  # pylint:disable=no-self-use
        """Updates a user's ssh keys for a specific system

        :param user: Django user instance
        :param str priv_key: Private Key
        :param str pub_key: Public Key
        """
        try:
            SSHKeys.objects.update_keys(
                user,
                system_id=system_id,
                priv_key=priv_key,
                pub_key=pub_key
            )
        except SSHKeys.DoesNotExist:
            SSHKeys.objects.save_keys(
                user,
                system_id=system_id,
                priv_key=priv_key,
                pub_key=pub_key
            )

    # How does this interact with PORTAL_STORAGE_SYSTEMS? On longhorn
    # it will be /home1/group_id/user, but on stockyard based systems
    # such as stampede2 it will be /work/group_id/user
    # - JChuah
    def get_home_dir_abs_path(self, *args, **kwargs):
        """Returns home directory absolute path

        *Home directory* refers to the directory where every user's
         home directory will live. In some portals we will have a
         centralized directory.
         When using $WORK for the home dir init with tas_user

        :returns: Absolute path
        :rtype: str
        """
        try:
            self.tas_user
            return os.path.join(
                settings.system['home_directory'],
                self.tas_user['homeDirectory'],
            )
        except:
            return os.path.join(
                settings.system['abs_home_directory'],
                self.user.username
            )

    def get_system_id(self, *args, **kwargs):
        """Returns system Id

        *System Id* is a string, unique id for each system.
        This function returns the system id for a user's home system.

        :returns: System unique id
        :rtype: str
        """
        return self.system['prefix'].format(self.user.username)

    def get_system_definition(
            self,
            publ_key_str,
            priv_key_str
    ):  # pylint:disable=arguments-differ
        """Returns Agave system definition

        :returns: Agave system definition
        :rtype: dict
        """
        username = self.user.username
        # system = 'frontera.home.keiths'
        # system = 'longhorn.home.keiths'
        system = StorageSystem(
            service_account(),
            self.get_system_id(self.user)
        )
        system.site = 'portal.dev'
        system.description = 'Home system for user: {username}'.format(
            username=username
        )
        system.name = self.get_system_id(self.user)                         # frontera.home.keiths
        system.storage.port = 22
        system.storage.home_dir = '/'
        system.storage.root_dir = self.get_home_dir_abs_path(self.user)     # '/corral-repl/tacc/aci/CEP/home_dirs/'
        system.storage.protocol = 'SFTP'
        system.storage.host = self.get_storage_host(self.user)              # 'frontera.tacc.utexas.edu'
        system.storage.auth.username = self.get_storage_username(self.user) # 'keiths'
        system.storage.auth.type = system.AUTH_TYPES.SSHKEYS                # ???
        system.storage.auth.public_key = publ_key_str
        system.storage.auth.private_key = priv_key_str
        return system

    # replace this with method from user_work_home.py
    # def get_storage_host(self, *args, **kwargs):
    #     """Returns storage host

    #     Every Agave System definition has a *Storage Host* to which it connects
    #      to.

    #     :returns: Storage Host to connect to
    #     :rtype: str
    #     """
    #     return self.system['host']

    def get_storage_username(
            self,
            *args,
            **kwargs
    ):
        """Returns storage username

        Every Agave System definition uses a username
        and ssh keys (or password) to authenticate to
        the storage system.
        This function returns that username

        :returns: Storage username
        :rtype: str
        """
        return self.user.username

    def create_home_system(self, *args, **kwargs):
        """Create user's home directory

        :param user: User instance

        :returns: Agave response for the folder created

        .. todo::
            This method should return a :clas:`BaseSystem` instance
        """
        private_key = EncryptionUtil.create_private_key()
        priv_key_str = EncryptionUtil.export_key(private_key, 'PEM')
        public_key = EncryptionUtil.create_public_key(private_key)
        publ_key_str = EncryptionUtil.export_key(public_key, 'OpenSSH')
        system = self.get_system_definition(
            publ_key_str,
            priv_key_str
        )
        system.validate()
        system.save()
        system.update_role(self.user.username, 'OWNER')
        self._save_user_keys(
            self.user,
            system.id,
            priv_key_str,
            publ_key_str
        )
        return system

    def get_system(self, *args, **kwargs):
        """Gets user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        agc = service_account()
        home_sys = agc.systems.get(
            systemId=self.get_system_id(
                self.user
            )
        )
        return home_sys

    def get_or_create_system(self, *args, **kwargs):
        """Gets or creates user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        try:
            home_sys = self.get_system(self.user)
            return home_sys
        except HTTPError as exc:
            if exc.response.status_code == 404:
                home_sys = self.create_home_system(self.user)
                return home_sys

    def reset_system_keys(self, *args, **kwargs):
        """Resets home system SSH Keys

        :param user: User instance

        :returns: Public key
        :rtype: str
        """
        home_sys = StorageSystem(
            client=self.user.agave_oauth.client,
            id=self.get_system_id(self.user)
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
        self._update_user_keys(
            self.user,
            home_sys.id,
            priv_key_str,
            publ_key_str,
        )
        return publ_key_str
