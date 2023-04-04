"""
.. :module:: apps.accounts.managers.accounts
   :synopsis: Manager handling anything pertaining to accounts
"""
import logging
from importlib import import_module
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from paramiko.ssh_exception import (
    AuthenticationException,
    ChannelException,
    SSHException
)
from portal.utils.encryption import createKeyPair
from portal.apps.accounts.models import SSHKeys
from portal.apps.accounts.managers.ssh_keys import KeyCannotBeAdded
from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials

logger = logging.getLogger(__name__)


def check_user(username):
    """Verifies username

    Checks if a username exists or if there's more than one user
    with the same username
    """
    users = get_user_model().objects.filter(username=username)
    if not users:
        raise ValueError(
            'No user with the username: {username} exists'.format(
                username=username)
        )
    elif len(users) > 1:
        logger.warning(
            'Multiple users with the username: %s exists',
            username
        )
    return users[0]


def _lookup_keys_manager(user, password, token):
    """Lookup Keys Manager
    This function allows to use a custom `KeysManager` class
    to handle any special cases for setup.
    .. seealso::
        :class:`~portal.apps.accounts.managers.ssh_keys.KeysManager`
    """
    mgr_str = getattr(
        settings,
        'PORTAL_KEYS_MANAGER',
    )
    module_str, cls_str = mgr_str.rsplit('.', 1)
    module = import_module(module_str)
    cls = getattr(module, cls_str)
    return cls(user.username, password, token)


def reset_system_keys(user, system_id, hostname=None):
    """Reset system's Keys

    Creates a new set of keys, saves the set of keys to the DB
    and updates the Tapis System.

    :param user: Django User object
    """
    logger.info(f"Resetting credentials for user {user.username} on system {system_id}")
    (priv_key_str, publ_key_str) = createKeyPair()
    create_system_credentials(user.tapis_oauth.client,
                              user.username,
                              publ_key_str,
                              priv_key_str,
                              system_id,
                              skipCredentialCheck=True)

    if hostname is None:
        sys = user.tapis_oauth.client.systems.getSystem(systemId=system_id)
        hostname = sys.host

    # Update keys for hostname
    SSHKeys.objects.update_hostname_keys(
        user,
        hostname=hostname,
        priv_key=priv_key_str,
        pub_key=publ_key_str
    )

    return publ_key_str


def queue_pub_key_setup(
        username,
        password,
        token,
        system_id,
        hostname,
        port=22
):
    """Queue Public Key Setup

    Convenient function to queue a specific celery task
    """
    user = check_user(username)

    from portal.apps.accounts.tasks import (
        setup_pub_key,
        monitor_setup_pub_key
    )
    res = setup_pub_key.apply_async(
        kwargs={
            'user': user,
            'password': password,
            'token': token,
            'system_id': system_id,
            'hostname': hostname,
            'port': port
        },
        expires=60,
        routing_key='onboard'
    )
    monitor_setup_pub_key.apply_async(
        args=(res.id, ),
        routing_key='onboard'
    )


def add_pub_key_to_resource(
        user,
        password,
        token,
        system_id,
        hostname=None,
        port=22
):
    """Add Public Key to Remote Resource

    :param user: Django User object
    :param str password: Username's pasword to remote resource
    :param str token: TACC's token
    :param str system_id: Tapis system's id
    :param str hostname: Resource's hostname
    :param int port: Port to use for ssh connection

    :raises: :class:`~portal.apps.accounts.managers.`

    """
    success = True
    mgr = _lookup_keys_manager(user, password, token)
    message = "add_pub_key_to_resource"

    logger.info(f"Adding public key for user {user.username} on system {system_id}")
    try:
        if hostname is None:
            sys = user.tapis_oauth.client.systems.getSystem(systemId=system_id)
            hostname = sys.host

        transport = mgr.get_transport(hostname, port)
        try:
            pub_key = user.ssh_keys.for_hostname(hostname).public
        except ObjectDoesNotExist:
            raise
        message = mgr.add_public_key(
            system_id,
            hostname,
            pub_key,
            port=port,
            transport=transport
        )
        status = 200
    except Exception as exc:
        # Catch all exceptions and set a status code for unknown exceptions
        success = False
        message = str(exc)
        logger.error(exc, exc_info=True)
        try:
            # "Re-throw" exception to get known exception type status codes
            raise exc
        except AuthenticationException:
            # Bad password/token
            status = 403  # Forbidden
        except ObjectDoesNotExist:
            # user.ssh_keys does not exist, suggest resetting keys
            status = 409  # Conflict
        except KeyCannotBeAdded:
            # May occur when system is down
            message = "KeyCannotBeAdded"  # KeyCannnotBeAdded exception does not contain a message?
            status = 503
        except (
            ChannelException,
            SSHException
        ) as exc:
            # cannot ssh to system
            message = str(type(exc))  # paramiko exceptions do not contain a string message?
            status = 502  # Bad gateway

    return success, message, status
