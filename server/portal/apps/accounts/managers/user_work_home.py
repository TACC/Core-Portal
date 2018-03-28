"""
.. :module:: apps.accounts.managers.user_home
   :synopsis: Manager handling anything pertaining to user's home directory
"""
from __future__ import unicode_literals, absolute_import
import os
import logging
from django.conf import settings
from pytas.models.users import User as TASUser
from portal.apps.accounts.managers.user_home import UserHomeManager

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class UserWORKHomeManager(UserHomeManager):
    """User $WORK Home Manager

    Use this manager if you would like to use $WORK as a user's home directory
    """
    def __init__(self, *args, **kwargs):
        super(UserWORKHomeManager, self).__init__(*args, **kwargs)
        self.tas_user = TASUser(username=self.user.username)

    def get_or_create_dir(self, *args, **kwargs):
        """Gets or creates user's home directory

        :param user: User instance

        :returns: Agave response for the folder

        .. note::
            We do not need to create the directory instead we check we have a value in
            `homeDirectory` from `TAS`
        """
        path = self.tas_user.homeDirectory#pylint: disable=no-member
        assert self.tas_user
        assert self.user.username in path

    def get_home_dir_abs_path(self, *args, **kwargs):
        """Returns home directory absolute path

        *Home directory* refers to the directory where every user's
         home directory will live. In some portals we will have a
         centralized directory. In other portals we might use a user's
         $WORK or any other remote system.

        :returns: Absolute path
        :rtype: str
        """
        return os.path.join(
            'work',
            self.tas_user.homeDirectory,#pylint: disable=no-member
            'stampede2'
        )

    def get_storage_host(self, *args, **kwargs):#pylint:disable=no-self-use
        """Returns storage host

        Every Agave System definition has a *Storage Host* to which it connects
         to.

        :returns: Storage Host to connect to
        :rtype: str
        """
        return settings.PORTAL_DATA_DEPOT_STORAGE_HOST

    def get_storage_username(self, *args, **kwargs):
        """Returns storage username

        Every Agave System definition uses a username and ssh keys (or password)
         to authenticate to the storage system. This function returns that username

        :returns: Storage username
        :rtype: str
        """
        return self.user.username
