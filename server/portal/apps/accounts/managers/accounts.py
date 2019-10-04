"""
.. :module:: apps.accounts.managers.accounts
   :synopsis: Manager handling anything pertaining to accounts
"""

import logging
from inspect import isclass, isfunction
from importlib import import_module
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.serializers import BaseAgaveSystemSerializer

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


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
