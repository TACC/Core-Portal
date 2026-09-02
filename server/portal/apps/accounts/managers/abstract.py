"""
.. :module:: apps.accounts.managers.abstract
   :synopsis: Abstract Keys Manager
"""

from abc import ABCMeta, abstractmethod
from six import add_metaclass


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
