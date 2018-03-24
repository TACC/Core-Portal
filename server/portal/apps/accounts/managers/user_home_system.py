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
from Crypto.PublicKey import RSA

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def _create_private_key():
    return RSA.generate(2048)

def _create_public_key(priv_key):
    return priv_key.publickKey()

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
    priv_key_str = private_key.exportKey('PEM')
    public_key = _create_public_key(private_key)
    publ_key_str = public_key.exportKey('OpenSSH')
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
            'mirror': False,
            'port': 22,
            'homeDir': path(username),
            'rootDir': '/',
            'protocol': 'SFTP',
            'host': settings.PORTAL_DATA_DEPOT_STORAGE_HOST,
            'publicAppsDir': None,
            'proxy': None,
            'auth': {
                'username': settings.PORTAL_ADMIN_USERNAME,
                'type': 'SSHKEYS',
                'publicKey': publ_key_str,
                'privateKey': priv_key_str
            }
        }
    }
    home_sys = agc.systems.add(
        body=system_body)
    return home_sys

def get(user):
    """Gets user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    agc = service_account()
    username = user.username
    home_sys = agc.systems.get(system_id(username))
    return home_sys

def get_or_create(user):
    """Gets or creates user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    try:
        home_sys = get(user)
        return home_sys
    except HTTPError as exc:
        if exc.response.status_code == 404:
            home_sys = create(user)
            return home_sys
