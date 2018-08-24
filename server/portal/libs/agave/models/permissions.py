"""
.. module: portal.libs.agave.models.permissions
   :synopsis: Classes representing Agave permissions for different resources.
"""
from __future__ import unicode_literals, absolute_import
import os
import logging
import json
import urllib
from .base import BaseAgaveResource

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class FilePermissions(BaseAgaveResource):
    """File Permissions"""
    READ = 'READ'
    READ_WRITE = 'READ_WRITE'
    READ_EXECUTE = 'READ_EXECUTE'
    WRITE = 'WRITE'
    WRITE_EXECUTE = 'WRITE_EXECUTE'
    EXECUTE = 'EXECUTE'
    ALL = 'ALL'
    NONE = 'NONE'

    def __init__(self, client, agave_file, **kwargs):
        """
        :param client: Agave client
        :param agave_file: Agave file

        """
        super(FilePermissions, self).__init__(client, kwargs)
