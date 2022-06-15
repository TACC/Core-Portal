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
from portal.utils import encryption as EncryptionUtil
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.serializers import BaseAgaveSystemSerializer
from portal.apps.accounts.models import SSHKeys
from portal.apps.accounts.managers.ssh_keys import KeyCannotBeAdded
from portal.apps.accounts.managers.user_systems import UserSystemsManager

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


def setup(username, system):
    """Fires necessary steps for setup

    Called asynchronously from portal.apps.auth.tasks.setup_user

    As of 03/2018 a new account setup means creating a home directory
    (optional), creating an Agave system for that home directory
    and saving the newly created keys in the database.
    The private key will be encrypted using AES.

    :param str username: Account's username to setup

    :return: home_dir

    .. note::
        The django setting `PORTAL_USER_ACCOUNT_SETUP_STEPS` can be used to
        add any additional steps after the default setup.
    """

    user = check_user(username)
    mgr = UserSystemsManager(user, system)
    home_dir = mgr.get_private_directory(user)
    systemId = mgr.get_system_id()
    system = StorageSystem(user.tapis_oauth.client, id=systemId)
    success, result = system.test()
    if success:
        logger.info(
            "{username} has valid configuration for {systemId}, skipping creation".format(
                username=username, systemId=systemId
            )
        )
        return home_dir
    mgr.setup_private_system(user)

    return home_dir


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

    sys_dict = user.tapis_oauth.client.systems.get(systemId=system_id)
    if sys_dict['type'] == StorageSystem.TYPES.STORAGE:
        sys = StorageSystem.from_dict(user.tapis_oauth.client, sys_dict)
    elif sys_dict['type'] == ExecutionSystem.TYPES.EXECUTION:
        sys = ExecutionSystem.from_dict(user.tapis_oauth.client, sys_dict)

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
    mgr = _lookup_keys_manager(user, password, token)
    message = "add_pub_key_to_resource"
    try:
        transport = mgr.get_transport(hostname, port)
        try:
            pub_key = user.ssh_keys.for_hostname(hostname).public
        except ObjectDoesNotExist:
            try:
                pub_key = user.ssh_keys.for_system(system_id).public
            except Exception:
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


def storage_systems(user, offset=0, limit=100):
    """Return all storage systems for a user.

    :param user: Django user's instance
    :param int offset: Offset.
    :param int limit: Limit.
    """
    systems = []
    res = StorageSystem.list(
        user.tapis_oauth.client,
        type=StorageSystem.TYPES.STORAGE,
        offset=offset,
        limit=limit
    )
    systems = list(res)
    return systems


def execution_systems(user, offset=0, limit=100):
    """Return all execution systems for a user.

    :param user: Django user's instance
    :param int offset: Offset.
    :param int limit: Limit.
    """
    systems = []
    res = ExecutionSystem.list(
        user.tapis_oauth.client,
        type=ExecutionSystem.TYPES.EXECUTION,
        offset=offset,
        limit=limit
    )
    systems = list(res)
    return systems


def get_system(user, system_id):
    """Returns system

    :param user: Django's user object
    :param str system_id: System id
    :returns: System object
    :rtype: :class:`StorageSystem` or :class:`ExecutionSystem`
    """
    system = user.tapis_oauth.client.systems.get(systemId=system_id)
    if system.type == StorageSystem.TYPES.STORAGE:
        sys = StorageSystem.from_dict(user.tapis_oauth.client, system)
    elif system.type == ExecutionSystem.TYPES.EXECUTION:
        sys = ExecutionSystem.from_dict(user.tapis_oauth.client, system)

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
