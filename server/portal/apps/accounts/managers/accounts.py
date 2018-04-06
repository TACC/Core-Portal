"""
.. :module:: apps.accounts.managers.accounts
   :synopsis: Manager handling anything pertaining to accounts
"""
from __future__ import unicode_literals, absolute_import
import inspect
import logging
from importlib import import_module
from django.contrib.auth import get_user_model
from django.conf import settings

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def check_user(username):
    """Verifies username

    Checks if a username exists or if there's more than one user
    with the same username
    """
    users = get_user_model().objects.filter(username=username)
    if not len(users):
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

def _lookup_user_home_manager(user):
    """Lookup User Home Manager

    This function allows to use a custom `UserHomeManager` class
    to handle any special cases for setup.

    .. seealso::
        :class:`~portal.apps.accounts.managers.user_home.AbstractUserHomeManager` and
        :class:`~portal.apps.accounts.managers.user_home.UserHomeManager`
    """
    mgr_str = getattr(
        settings,
        'PORTAL_USER_HOME_MANAGER',
    )
    module_str, cls_str = mgr_str.rsplit('.', 1)
    module = import_module(module_str)
    cls = getattr(module, cls_str)
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

    As of 03/2018 a new account setup means creating a home directory (optional),
    creating an Agave system for that home directory and saving the newly created
    keys in the database. The private key will be encrypted using AES.

    :param str username: Account's username to setup

    :return: home_dir, home_sys

    .. note::
        The django setting `PORTAL_USER_ACCOUNT_SETUP_STEPS` can be used to
        add any additional steps after the default setup.

        `PORTAL_USER_ACCOUNT_SETUP_STEPS` is a list of strings. The dot notation
        of any custom class or callable. Any class listed should implement a `step()`
        method, which will be called.

        Classes will be instantiated with `user`, `home_dir`, `home_sys` in that order
        and then the `step()` method will be called with the last step's return value.
        If there are no previous step `None` will be passsed.

        Callables will be called with 'res', `user`, `home_dir` and `home_sys` in that order.
        `res` is the last step's return value.
    """
    user = check_user(username)
    mgr = _lookup_user_home_manager(user)
    logger.debug('User Home Manager class: %s', mgr.__class__)
    home_dir = mgr.get_or_create_dir(user)
    home_sys = mgr.get_or_create_system(user)
    extra_steps = getattr(settings, 'PORTAL_USER_ACCOUNT_SETUP_STEPS', [])
    res = None
    for step in extra_steps:
        module_str, callable_str = step.rsplit('.', 1)
        module = import_module(module_str)
        call = getattr(module, callable_str)
        if inspect.isclass(call):
            res = call(user, home_dir, home_sys).step(res)
        elif inspect.isfunction(call):
            res = call(res, user, home_dir, home_sys)
        else:
            raise ValueError(
                'Setup step {step_str} is not a class or function'.format(
                    step_str=step
                )
            )
    return home_dir, home_sys

def reset_home_system_keys(username):
    """Reset home system Keys

    Creates a new set of keys, saves the set of keys to the DB
    and updates the Agave system

    .. note::
        If this functionality needs to be overridden it must be done
        in a :class:`~portal.apps.accounts.managers.user_home.UserHomeManager` or
        :class:`~portal.apps.accounts.managers.user_home.AbstractUserHomeManager` subclass
        and overwrite the `reset_system_keys` method.
    """
    user = check_user(username)
    mgr = _lookup_user_home_manager(user)
    mgr.reset_system_keys(user)
