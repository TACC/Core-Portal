"""
.. :module:: apps.accounts.managers.user_home
   :synopsis: Manager handling anything pertaining to user's home directory
"""
from __future__ import unicode_literals, absolute_import
import os
import logging
from Crypto.PublicKey import RSA
from django.conf import settings
from requests.exceptions import HTTPError
from portal.libs.agave.utils import service_account
from portal.libs.agave.models.systems import BaseSystem
from portal.apps.accounts.models import SSHKeys

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def _create_private_key():
    return RSA.generate(2048)

def _create_public_key(priv_key):
    return priv_key.publickey()

def _save_user_keys(user, system_id, priv_key, pub_key):
    """Saves a user's ssh keys for a specific system

    :param user: Django user instance
    :param str priv_key: Private Key
    :param str pub_key: Public Key
    """
    SSHKeys.objects.save_keys(
        user,
        system_id=system_id,
        priv_key=priv_key,
        pub_key=pub_key)

def get_home_dir_abs_path(user):
    """path"""
    return os.path.join(
        settings.PORTAL_DATA_DEPOT_DEFAULT_HOME_DIR_ABS_PATH,
        user.username
    )

def get_system_id(user):
    """system_id"""
    return '.'.join([
        settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX,
        user.username])

def get_storage_host(user):
    """storage host"""
    return settings.PORTAL_DATA_DEPOT_STORAGE_HOST

def get_storage_username(user):
    """storage username"""
    return user.username

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
        'id': get_system_id(user),
        'site': 'portal.dev',
        'default': False, 'status': 'UP',
        'description': 'Home system for user: {username}'.format(username=username),
        'name': get_system_id(user),
        'globalDefault': False,
        'availbale': True,
        'public': False,
        'type': 'STORAGE',
        'storage': {
            'mirror': False,
            'port': 22,
            'homeDir': '/',
            'rootDir': get_home_dir_abs_path(user),
            'protocol': 'SFTP',
            'host': get_storage_host(user),
            'publicAppsDir': None,
            'proxy': None,
            'auth': {
                'username': get_storage_username(user),
                'type': 'SSHKEYS',
                'publicKey': publ_key_str,
                'privateKey': priv_key_str
            }
        }
    }
    home_sys = agc.systems.add(
        body=system_body)
    agc.systems.updateRole(
        systemId=system_body['id'],
        body={
            'role': 'OWNER',
            'username': user.username
        })
    _save_user_keys(
        user,
        system_body['id'],
        priv_key_str,
        publ_key_str
    )
    return home_sys

def get(user):
    """Gets user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    agc = service_account()
    home_sys = agc.systems.get(systemId=get_system_id(user))
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

def reset_home_system_keys(user):
    """Resets home system SSH Keys

    :param user: User instance

    :returns: Agave System response
    """
    home_sys = BaseSystem(
        client=user.agave_oauth.client,
        id=get_system_id(user)
    )

    private_key = _create_private_key()
    priv_key_str = private_key.exportKey('PEM')
    public_key = _create_public_key(private_key)
    publ_key_str = public_key.exportKey('OpenSSH')

    home_sys.set_storage_keys(
        user.username,
        priv_key_str,
        publ_key_str
    )
    _save_user_keys(
        user,
        home_sys.id,
        priv_key_str,
        publ_key_str
    )
