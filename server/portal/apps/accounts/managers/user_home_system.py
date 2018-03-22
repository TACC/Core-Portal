"""
.. :module:: apps.accounts.managers.user_home
   :synopsis: Manager handling anything pertaining to user's home directory
"""
from __future__ import unicode_literals, absolute_import
import os
import logging
from django.conf import settings
from requests.exceptions import HTTPError
from portal.libs.agave.utils import service_account

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def _create_private_key():
    return 'private_key'

def _create_public_key():
    return 'public_key'

def path(username):
    """path"""
    return os.path.join('home', username)

def system_id(username):
    """system_id"""
    return '.'.join([
        settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX,
        username])

def create(user):
    """Create user's home directory

    :param user: User instance

    :returns: Agave response for the folder created
    """
    private_key = _create_private_key()
    public_key = _create_public_key()
    agc = service_account()
    username = user.username
    system_body = {
        'id': system_id(username),
        'site': 'portal.dev',
        'default': False,
        'status': 'UP',
        'description': 'Home system for user: {username}'.format(username=username),
        'name': system_id(username),
        'globalDefault': False,
        'availbale': True,
        'public': False,
        'type': 'STORAGE',
        'storage': {
            'homeDir': path(username),
            'rootDir': '/'
        }
    }
    home_dir = agc.systems.add(
        body=system_body)
    return private_key, public_key, home_dir

def get(user):
    """Gets user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    agc = service_account()
    username = user.username
    home_sys = agc.files.list(
        systemId=settings.AGAVE_STORAGE_SYSTEM,
        filePath=username)
    return home_sys

def get_or_create(user):
    """Gets or creates user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    try:
        home_sys = get(user)
        return None, None, home_sys
    except HTTPError as exc:
        if exc.response.status_code == 404:
            private_key, public_key, home_sys = create(user)
            return private_key, public_key, home_sys
