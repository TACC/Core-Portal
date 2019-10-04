"""
.. :module:: apps.accounts.managers.abstract
   :synopsis: Abstract User Home Manager
"""

import logging
from abc import ABCMeta, abstractmethod
from six import add_metaclass

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


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

    def __init__(
            self,
            user,
            *args,
            **kwargs):  # pylint: disable=unused-argument
        """Initialize Manager

        :param user: Django user instance
        """
        self.user = user

    @abstractmethod
    def mkdir(self, *args, **kwargs):  # pylint: disable=unused-argument
        """Create user's home directory

        :param user: User instance

        :returns: Agave response for the folder created
        """
        return NotImplemented

    @abstractmethod
    def get_dir(self, *args, **kwargs):  # pylint: disable=unused-argument
        """Gets user's home directory

        :param user: User instance

        :returns: Agave response for the folder
        """
        return NotImplemented

    @abstractmethod
    def get_or_create_dir(
            self,
            *args,
            **kwargs):  # pylint: disable=unused-argument
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

        Every Agave System definition uses a username and ssh
        keys (or password) to authenticate to the storage system.
        This function returns that username

        :returns: Storage username
        :rtype: str
        """
        return NotImplemented

    @abstractmethod
    def get_system_definition(
            self,
            publ_key_str,
            priv_key_str,
            *args,
            **kwargs
    ):
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
        """Resets home system keys

        :returns: Set of keys
        """
        return NotImplemented


@add_metaclass(ABCMeta)  # pylint: disable=no-init,too-few-public-methods
class AbstractKeysManager:
    """Abstract Keys Manager

    Abstract class to define a manager for user's keys.
    This manager takes care of anything needed to do with
    keys that happens outside the portal.
    As of 04/2018 we are storing keys in the portal's DB
    using AES encryption. All of that is handled in the
    :class:`~portal.apps.accounts.models.SSHKeysManager`.
    This manager takes care of placing the ssh keys in the
    correct remote box and anything else needed to do that.
    """

    @abstractmethod
    def add_public_key(
            self,
            system_id,
            hostname,
            port,
            public_key
    ):  # pylint: disable=too-many-arguments
        """Adds public key to `authorized_keys`"""
        return NotImplemented
