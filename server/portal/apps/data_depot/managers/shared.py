"""
.. module: portal.apps.data_depot.managers.private_data
   :synopsis: Manager handling Shared data.
"""
from __future__ import unicode_literals, absolute_import
import os
import logging
from future.utils import python_2_unicode_compatible
from django.conf import settings
from django.contrib.auth import get_user_model
from portal.apps.data_depot.managers.base import AgaveFileManager
# from portal.libs.elasticsearch.docs.files import BaseFile
from portal.libs.agave.models.files import BaseFile
from portal.libs.elasticsearch.serializers import BaseAgaveFileSerializer
from portal.utils.exceptions import ApiMethodNotAllowed
from portal.libs.agave.utils import service_account

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class FileManager(AgaveFileManager):
    """File Manager handling shared data.
    """
    def __init__(self, request=None, **kwargs):#pylint: disable=super-init-not-called
        """Initializing client data

        Saving necessary details from request for further searches.

        :param request: Django request object.

        """
        try:
            # client = kwargs.get('client',
            #                     request.user.agave_oauth.client)
            client = service_account()
            
            self.username = kwargs.get('username',
                                       request.user.username)
            self.session_id = kwargs.get('session_id',
                                         request.session.session_key)
            self.serializer_cls = BaseAgaveFileSerializer
        except AttributeError:
            raise
            #community_user = settings.AGAVE_COMMUNITY_ACCOUNT
            #self._ac = get_user_model().\
            #           objects.get(username=community_user)
        super(FileManager, self).__init__(client, **kwargs)


    @property
    def requires_auth(self):
        """Weather it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return True
