"""
.. :module:: apps.accounts.managers.accounts
   :synopsis: Manager handling anything pertaining to accounts
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.contrib.auth import get_user_model
from portal.apps.accounts.managers import user_home, user_home_system

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def check_user(username):
    """Checks if a username exists or if there's more than one user
     with the same username"""
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

def setup(username):
    """setup"""
    user = check_user(username)
    home_dir = user_home.get_or_create(user)
    home_sys = user_home_system.get_or_create(user)
    return home_dir, home_sys
