"""
.. :module:: apps.accounts.managers.user_home
   :synopsis: Manager handling anything pertaining to user's home directory
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.conf import settings
from requests.exceptions import HTTPError
from portal.libs.agave.utils import service_account

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def create(user):
    """Create user's home directory

    :param user: User instance

    :returns: Agave response for the folder created
    """
    agc = service_account()
    username = user.username
    home_dir = agc.files.mkdir(
        systemId=settings.AGAVE_STORAGE_SYSTEM,
        filePath=username)
    return home_dir

def get(user):
    """Gets user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    agc = service_account()
    username = user.username
    home_dir = agc.files.list(
        systemId=settings.AGAVE_STORAGE_SYSTEM,
        filePath=username)
    return home_dir

def get_or_create(user):
    """Gets or creates user's home directory

    :param user: User instance

    :returns: Agave response for the folder
    """
    try:
        home_dir = get(user)
        return home_dir
    except HTTPError as exc:
        if exc.response.status_code == 404:
            home_dir = create(user)
            return home_dir
