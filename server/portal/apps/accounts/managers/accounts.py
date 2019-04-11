"""
.. :module:: apps.accounts.managers.accounts
   :synopsis: Manager handling anything pertaining to accounts
"""
from __future__ import unicode_literals, absolute_import
import logging
from inspect import isclass, isfunction
from importlib import import_module
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from paramiko.ssh_exception import (
    AuthenticationException,
    ChannelException,
    SSHException
)
from portal.utils import encryption as EncryptionUtil
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.serializers import BaseAgaveSystemSerializer
from portal.apps.accounts.models import SSHKeys, Keys
from portal.apps.accounts.managers.ssh_keys import KeyCannotBeAdded
from portal.apps.onboarding.execute import (
    execute_setup_steps,
    new_user_setup_check
)

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


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
        logger.warn(
            'Multiple users with the username: %s exists',
            username
        )
    return users[0]


def _import_manager(mgr_str):
    """Import Manager

    Shortcut function to import a manager class referenced by a
    dot notation string
    """
    module_str, cls_str = mgr_str.rsplit('.', 1)
    module = import_module(module_str)
    cls = getattr(module, cls_str)
    return cls


def _lookup_keys_manager(user, password, token):
    """Lookup User Home Manager

    This function allows to use a custom `UserHomeManager` class
    to handle any special cases for setup.

    .. seealso::
        :class:`~portal.apps.accounts.managers.
        abstract.AbstractUserHomeManager` and
        :class:`~portal.apps.accounts.managers.user_home.UserHomeManager`
    """
    mgr_str = getattr(
        settings,
        'PORTAL_KEYS_MANAGER',
    )
    cls = _import_manager(mgr_str)
    return cls(user.username, password, token)


def _lookup_user_home_manager(user):
    """Lookup User Home Manager

    This function allows to use a custom `UserHomeManager` class
    to handle any special cases for setup.

    .. seealso::
        :class:`~portal.apps.accounts.managers.
        abstract.AbstractUserHomeManager` and
        :class:`~portal.apps.accounts.managers.user_home.UserHomeManager`
    """
    mgr_str = getattr(
        settings,
        'PORTAL_USER_HOME_MANAGER',
    )
    cls = _import_manager(mgr_str)
    return cls(user)


def get_user_home_system_id(user):
    """Gets user home system id

    Shortcut method to return the user's home system id

    :param user: Django user instance
    :return: System id
    :rtype: str
    """
    mgr = _lookup_user_home_manager(user)
    return mgr.get_system_id()

def setup(username):
    """Fires necessary steps for setup

    Called asynchronously from portal.apps.auth.tasks.setup_user

    As of 03/2018 a new account setup means creating a home directory
    (optional), creating an Agave system for that home directory
    and saving the newly created keys in the database.
    The private key will be encrypted using AES.

    :param str username: Account's username to setup

    :return: home_dir, home_sys

    .. note::
        The django setting `PORTAL_USER_ACCOUNT_SETUP_STEPS` can be used to
        add any additional steps after the default setup.
    """

    user = check_user(username)
    mgr = _lookup_user_home_manager(user)
    logger.debug('User Home Manager class: %s', mgr.__class__)
    home_dir = mgr.get_or_create_dir(user)
    home_sys = mgr.get_or_create_system(user)
    if not user.profile.setup_complete:
        logger.info("Executing setup steps for %s", username)
        execute_setup_steps(user.username)

    return home_dir, home_sys


def reset_home_system_keys(username, force=False):
    """Reset home system Keys

    Creates a new set of keys, saves the set of keys to the DB
    and updates the Agave system

    .. note::
        If this functionality needs to be overridden it must be done
        in a :class:`~portal.apps.accounts.managers.
        user_home.UserHomeManager` or :class:`~portal.apps.accounts.
        managers.abstract.AbstractUserHomeManager` subclass
        and overwrite the `reset_system_keys` method.
    """
    user = check_user(username)
    mgr = _lookup_user_home_manager(user)
    pub_key = mgr.reset_system_keys(user, force=force)
    return pub_key


def reset_system_keys(username, system_id):
    """Reset system's Keys

    Creates a new set of keys, saves the set of key to the DB
    and updates the Agave System.

    :param str username: Username

    .. note::
        If :param:`system_id` is a home system then the Home Manager
        class will be used to reset the keys.
        This because there might be some specific actions to do
        when managing home directories
    """
    user = check_user(username)
    home_sys_id = get_user_home_system_id(user)
    if system_id == home_sys_id:
        return reset_home_system_keys(username)

    sys_dict = user.agave_oauth.client.systems.get(systemId=system_id)
    if sys_dict['type'] == StorageSystem.TYPES.STORAGE:
        sys = StorageSystem.from_dict(user.agave_oauth.client, sys_dict)
    elif sys_dict['type'] == ExecutionSystem.TYPES.EXECUTION:
        sys = ExecutionSystem.from_dict(user.agave_oauth.client, sys_dict)

    private_key = EncryptionUtil.create_private_key()
    priv_key_str = EncryptionUtil.export_key(private_key, 'PEM')
    public_key = EncryptionUtil.create_public_key(private_key)
    publ_key_str = EncryptionUtil.export_key(public_key, 'OpenSSH')

    sys.set_storage_keys(
        username,
        priv_key_str,
        publ_key_str,
        update=(sys.type == StorageSystem.TYPES.STORAGE)
    )
    SSHKeys.objects.update_keys(
        user,
        system_id=system_id,
        priv_key=priv_key_str,
        pub_key=publ_key_str
    )

    # Update keys for hostname too
    SSHKeys.objects.update_hostname_keys(
        user,
        hostname=sys.storage.host,
        priv_key=priv_key_str,
        pub_key=publ_key_str
    )
    if sys.type == ExecutionSystem.TYPES.EXECUTION:
        sys.set_login_keys(
            username,
            priv_key_str,
            publ_key_str
        )

        SSHKeys.objects.update_hostname_keys(
            user,
            hostname=sys.login.host,
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
):  # pylint: disable=too-many-arguments
    """Queue Public Key Setup

    Convenient function to queue a specific celery task
    """
    from portal.apps.accounts.tasks import (
        setup_pub_key,
        monitor_setup_pub_key
    )
    res = setup_pub_key.apply_async(
        kwargs={
            'username': username,
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
        username,
        password,
        token,
        system_id,
        hostname=None,
        port=22
):  # pylint: disable=too-many-arguments
    """Add Public Key to Remote Resource

    :param str username: Username
    :param str password: Username's pasword to remote resource
    :param str token: TACC's token
    :param str system_id: Agave system's id
    :param str hostname: Resource's hostname
    :param int port: Port to use for ssh connection

    :raises: :class:`~portal.apps.accounts.managers.`

    """
    if hostname is None:
        user = check_user(username)
        sys = get_system(user, system_id)
        hostname = sys.storage.host

    success = True
    user = check_user(username)
    mgr = _lookup_keys_manager(
        user,
        password,
        token
    )
    message = "add_pub_key_to_resource"
    try:
        transport = mgr.get_transport(hostname, port)
        try:
            pub_key = user.ssh_keys.for_hostname(hostname).public
        except ObjectDoesNotExist:
            try:
                pub_key = user.ssh_keys.for_system(system_id).public
            except:
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
        except AuthenticationException as exc:
            # Bad password/token
            status = 403 # Forbidden
        except ( ObjectDoesNotExist ) as exc:
            # user.ssh_keys does not exist, suggest resetting keys
            status = 409 # Conflict
        except KeyCannotBeAdded:
            # May occur when system is down
            message = "KeyCannotBeAdded" # KeyCannnotBeAdded exception does not contain a message?
            status = 503
        except (
            ChannelException,
            SSHException
        ) as exc:
            # cannot ssh to system
            message = str(type(exc)) # paramiko exceptions do not contain a string message?
            status = 502 # Bad gateway

    return success, message, status


def storage_systems(user, offset=0, limit=100, filter_prefix=True):
    """Return all storage systems for a user.

    This function will do a filter using `settings.PORTAL_NAMESPACE`.
    It will do a regular listing if there's no value for
    `settings.PORTAL_NAMESPACE` or :param:`filter_prefix` is `False`.

    :param user: Django user's instance
    :param int offset: Offset.
    :param int limit: Limit.
    :param bool filter_prefix: Whether or not to filter by prefix.
    """
    prefix = getattr(
            settings,
            'PORTAL_NAMESPACE',
            ''
    )

    systems = StorageSystem.search(
        user.agave_oauth.client,
        {
            'type.eq': StorageSystem.TYPES.STORAGE,
            'id.like': '{}*'.format(prefix.lower())
        },
        offset=offset,
        limit=limit
    )
    out = list(systems)
    #if there aren't any storage systems that are namespaced
    #by PORTAL_NAMESPACE, just send a list of all available storage systems
    if not out:
        systems = StorageSystem.list(
            user.agave_oauth.client,
            type=StorageSystem.TYPES.STORAGE,
            offset=offset,
            limit=limit
        )
        out = list(systems)
    return out

def execution_systems(user, offset=0, limit=100, filter_prefix=True):
    """Return all execution systems for a user.

    This function will do a filter using `settings.PORTAL_NAMESPACE`.
    It will do a regular listing if there's no value for
    `settings.PORTAL_NAMESPACE` or :param:`filter_prefix` is `False`.

    :param user: Django user's instance
    :param int offset: Offset.
    :param int limit: Limit.
    :param bool filter_prefix: Whether or not to filter by prefix.
    """
    prefix = getattr(settings, 'PORTAL_NAMESPACE', '')
    if not prefix or not filter_prefix:
        systems = ExecutionSystem.list(
            user.agave_oauth.client,
            type=ExecutionSystem.TYPES.EXECUTION,
            offset=offset,
            limit=limit
        )
    else:
        systems = ExecutionSystem.search(
            user.agave_oauth.client,
            {
                'type.eq': ExecutionSystem.TYPES.EXECUTION,
                'id.like': '{}*'.format(prefix.lower())
            },
            offset=offset,
            limit=limit
        )
    return list(systems)


def public_key_for_systems(system_ids):
    """Returns public key for one or more systems

    :param user: Django user's instance
    :param list(str) system_ids: List of strings with system ids

    :returns: Dictionary with a key for each system id.
        Each nested dict will have a `public_key` and `owner` value.
    :rtype: dict

    .. todo::
        Need to check permissions to systems. Although we are
        only returning the public key we should make sure
        the user has access to the system
    """
    resp_dict = {}
    for system_id in system_ids:
        keys = {}
        try:
            keys_obj = Keys.objects.get(system=system_id)
            keys['public_key'] = keys_obj.public
            keys['owner'] = keys_obj.ssh_keys.user.username
        except Keys.DoesNotExist:
            keys['public_key'] = None
            keys['owner'] = None
        resp_dict[system_id] = keys.copy()

    return resp_dict


def get_system(user, system_id):
    """Returns system

    :param user: Django's user object
    :param str system_id: System id
    :returns: System object
    :rtype: :class:`StorageSystem` or :class:`ExecutionSystem`
    """
    system = user.agave_oauth.client.systems.get(systemId=system_id)
    if system.type == StorageSystem.TYPES.STORAGE:
        sys = StorageSystem.from_dict(user.agave_oauth.client, system)
    elif system.type == ExecutionSystem.TYPES.EXECUTION:
        sys = ExecutionSystem.from_dict(user.agave_oauth.client, system)

    sys.test()
    return sys


def test_system(user, system_id):
    """Test system

    :param user: Django's user object
    :param str system_id: System id
    :returns: message
    :rtype: str
    """
    system = get_system(user, system_id)
    success, result = system.test()
    return success, {
        'message': result,
        'systemId': system_id
    }


agave_system_serializer_cls = BaseAgaveSystemSerializer  # pylint:disable=C0103
