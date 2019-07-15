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
from django.core.exceptions import PermissionDenied

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
            client = service_account()
            self.request = request
            self.username = None
            self.session_id = kwargs.get('session_id',
                                         request.session.session_key)
            self.serializer_cls = BaseAgaveFileSerializer
        except AttributeError:
            raise
        super(FileManager, self).__init__(client, **kwargs)

    @property
    def requires_auth(self):
        """Whether it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return False

    def delete(self, file_id, **kwargs):
        return NotImplemented

    def mkdir(self, file_id, **kwargs):
        return NotImplemented

    def move(self, file_id_src, file_id_dest, **kwargs):
        return NotImplemented
    
    def trash(self, file_id, **kwargs):
        return NotImplemented

    def upload(self, file_id_dest, uploaded_files, ensure_path=False,
               **kwargs):
        return NotImplemented

    def update_pems(self, file_id, pems, **kwargs):
        return NotImplemented

    def rename(self, file_id_src, rename_to, **kwargs):
        return NotImplemented

    def copy(self, file_id_src, file_id_dest, **kwargs):
        if self.request and self.request.user.is_authenticated:
            super(FileManager, self).copy(self, file_id_src, file_id_dest, **kwargs)
        else:
            raise PermissionDenied
