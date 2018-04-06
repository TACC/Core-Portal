"""
.. :module:: apps.accounts.managers.user_home
   :synopsis: Manager handling anything pertaining to user's home directory
"""
from __future__ import unicode_literals, absolute_import
import os
import logging
import json
from abc import ABCMeta, abstractmethod
from six import add_metaclass
from requests.exceptions import HTTPError
from Crypto.PublicKey import RSA
from django.conf import settings
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.systems import BaseSystem
from portal.apps.accounts.models import SSHKeys

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@add_metaclass(ABCMeta)
class AbstractUserHomeManager:
    """Abstract class describing a Manager for a user's home
     directory and system.

    This manager should have the necessary functionality to manage
     any setup a user account would need for its home directory.

    This abstract class exists because it will be assumed
     most of the methods described here are existent.
    This will allow further customization for special cases

    .. note::
        Subclassing this abstract class should be a
         last resort option. Please, first see if the special case
         in question can be handled using `PORTAL_USER_ACCOUNT_SETUP_SETPS`
         or overriding some methods on :class:`UserHomeManager`
    """

    def __init__(self, user, *args, **kwargs):#pylint: disable=unused-argument
        """Initialize Manager

        :param user: Django user instance
        """
        self.user = user

    @abstractmethod
    def mkdir(self, *args, **kwargs):#pylint: disable=unused-argument
        """Create user's home directory

        :param user: User instance

        :returns: Agave response for the folder created
        """
        return NotImplemented

    @abstractmethod
    def get_dir(self, *args, **kwargs):#pylint: disable=unused-argument
        """Gets user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        return NotImplemented

    @abstractmethod
    def get_or_create_dir(self, *args, **kwargs):#pylint: disable=unused-argument
        """Gets or creates user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        return NotImplemented

    @abstractmethod
    def get_home_dir_abs_path(self, *args, **kwargs):
        """Returns home directory absolute path

        *Home directory* refers to the directory where every user's
         home directory will live. In some portals we will have a
         centralized directory. In other portals we might use a user's
         $WORK or any other remote system.

        :returns: Absolute path
        :rtype: str
        """
        return NotImplemented

    @abstractmethod
    def get_system_id(self, *args, **kwargs):
        """Returns system Id

        *System Id* is a string, unique id for each system.
        This function returns the system id for a user's home system.

        :returns: System unique id
        :rtype: str
        """
        return NotImplemented

    @abstractmethod
    def get_storage_host(self, *args, **kwargs):
        """Returns storage host.

        Every Agave System definition has a *Storage Host* to which it connects
         to.

        :returns: Storage Host to connect to
        :rtype: str
        """
        return NotImplemented

    @abstractmethod
    def get_storage_username(self, *args, **kwagrs):
        """Returns storage username

        Every Agave System definition uses a username and ssh keys (or password)
         to authenticate to the storage system. This function returns that username

        :returns: Storage username
        :rtype: str
        """
        return NotImplemented

    @abstractmethod
    def get_system_definition(self, publ_key_str, priv_key_str, *args, **kwargs):
        """Returns Agave system definition

        :returns: Agave system definition
        :rtype: dict
        """
        return NotImplemented

    @abstractmethod
    def create_home_system(self, *args, **kwargs):
        """Creates Agave System for a user's home directory

        :returns: Agave response for the folder created
        """
        return NotImplemented

    @abstractmethod
    def get_system(self, *args, **kwargs):
        """Gets User's agave home system"""
        return NotImplemented

    @abstractmethod
    def get_or_create_system(self, *args, **kwargs):
        """Gets or creates user's home system"""
        return NotImplemented

    @abstractmethod
    def reset_system_keys(self, *args, **kwargs):
        """Resets home system keys"""
        return NotImplemented

class UserHomeManager(AbstractUserHomeManager):
    """User Home Manager

    Any functionality needed to manage a user's home directory and system
    is implemented here. This is mainly used when setting up a new account
    or to renew keys.

    .. note::
        If a special case needs to be implemented first see if it can be done
         by adding classes/callabels to `PORTAL_USER_ACCOUNT_SETUP_STEPS`.
        If not, be careful when overriding methods in this class.
    """

    def mkdir(self, *args, **kwargs):#pylint: disable=unused-argument
        """Create user's home directory

        :param user: User instance

        :returns: Agave response for the folder created
        """
        agc = service_account()
        username = self.user.username
        body = {
            'action': 'mkdir',
            'path': username
        }
        home_dir = agc.files.manage(
            systemId=settings.AGAVE_STORAGE_SYSTEM,
            filePath=settings.PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_REL_PATH,
            body=body)
        return home_dir

    def get_dir(self, *args, **kwargs):#pylint: disable=unused-argument
        """Gets user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        agc = service_account()
        username = self.user.username
        home_dir = agc.files.list(
            systemId=settings.AGAVE_STORAGE_SYSTEM,
            filePath=username)
        logger.debug('home_dir: %s', json.dumps(dict(home_dir), indent=2))
        return home_dir

    def get_or_create_dir(self, *args, **kwargs):#pylint: disable=unused-argument
        """Gets or creates user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        try:
            home_dir = self.get_dir(self.user)
            return home_dir
        except HTTPError as exc:
            if exc.response.status_code == 404:
                home_dir = self.mkdir(self.user)
                return home_dir

    def _create_private_key(self):#pylint:disable=no-self-use
        return RSA.generate(2048)

    def _create_public_key(self, priv_key):#pylint:disable=no-self-use
        return priv_key.publickey()

    def _save_user_keys(self, user, system_id, priv_key, pub_key):#pylint:disable=no-self-use
        """Saves a user's ssh keys for a specific system

        :param user: Django user instance
        :param str priv_key: Private Key
        :param str pub_key: Public Key
        """
        SSHKeys.objects.save_keys(
            user,
            system_id=system_id,
            priv_key=priv_key,
            pub_key=pub_key)

    def get_home_dir_abs_path(self, *args, **kwargs):
        """Returns home directory absolute path

        *Home directory* refers to the directory where every user's
         home directory will live. In some portals we will have a
         centralized directory. In other portals we might use a user's
         $WORK or any other remote system.

        :returns: Absolute path
        :rtype: str
        """
        return os.path.join(
            settings.PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_ABS_PATH,
            self.user.username
        )

    def get_system_id(self, *args, **kwargs):
        """Returns system Id

        *System Id* is a string, unique id for each system.
        This function returns the system id for a user's home system.

        :returns: System unique id
        :rtype: str
        """
        return '.'.join([
            settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX,
            self.user.username])

    def get_system_definition(self, publ_key_str, priv_key_str):
        """Returns Agave system definition

        :returns: Agave system definition
        :rtype: dict
        """
        username = self.user.username
        system_body = {
            'id': self.get_system_id(self.user),
            'site': 'portal.dev',
            'default': False, 'status': 'UP',
            'description': 'Home system for user: {username}'.format(username=username),
            'name': self.get_system_id(self.user),
            'globalDefault': False,
            'availbale': True,
            'public': False,
            'type': 'STORAGE',
            'storage': {
                'mirror': False,
                'port': 22,
                'homeDir': '/',
                'rootDir': self.get_home_dir_abs_path(self.user),
                'protocol': 'SFTP',
                'host': self.get_storage_host(self.user),
                'publicAppsDir': None,
                'proxy': None,
                'auth': {
                    'username': self.get_storage_username(self.user),
                    'type': 'SSHKEYS',
                    'publicKey': publ_key_str,
                    'privateKey': priv_key_str
                }
            }
        }
        return system_body

    def get_storage_host(self, *args, **kwargs):#pylint:disable=no-self-use
        """Returns storage host

        Every Agave System definition has a *Storage Host* to which it connects
         to.

        :returns: Storage Host to connect to
        :rtype: str
        """
        return settings.PORTAL_DATA_DEPOT_STORAGE_HOST

    def get_storage_username(self, *args, **kwargs):#pylint:disable=unused-argument
        """Returns storage username

        Every Agave System definition uses a username and ssh keys (or password)
         to authenticate to the storage system. This function returns that username

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
        private_key = self._create_private_key()
        priv_key_str = private_key.exportKey('PEM')
        public_key = self._create_public_key(private_key)
        publ_key_str = public_key.exportKey('OpenSSH')
        system_body = self.get_system_definition(publ_key_str, priv_key_str)
        agc = service_account()
        home_sys = agc.systems.add(
            body=system_body)
        agc.systems.updateRole(
            systemId=system_body['id'],
            body={
                'role': 'OWNER',
                'username': self.user.username
            })
        self._save_user_keys(
            self.user,
            system_body['id'],
            priv_key_str,
            publ_key_str
        )
        return home_sys

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

        :returns: Agave System response
        """
        home_sys = BaseSystem(
            client=self.user.agave_oauth.client,
            id=self.get_system_id(self.user)
        )

        private_key = self._create_private_key()
        priv_key_str = private_key.exportKey('PEM')
        public_key = self._create_public_key(private_key)
        publ_key_str = public_key.exportKey('OpenSSH')

        home_sys.set_storage_keys(
            self.user.username,
            priv_key_str,
            publ_key_str
        )
        self._save_user_keys(
            self.user,
            home_sys.id,
            priv_key_str,
            publ_key_str
        )
