"""
.. module: portal.libs.elasticsearch.serializers
   :synopsis: serializers for elasticsearch classes
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
from portal.libs.elasticsearch.docs.base import BaseESResource

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class BaseAgaveSerializer(json.JSONEncoder):
    """Class to serialize an elasticsearch wrapper classes
    """
    def default(self, obj):#pylint: disable=method-hidden
        if isinstance(obj, BaseESResource):
            try:
                return obj.to_dict()
            except AttributeError:
                return obj._wrapped#pylint: disable=protected-access

        return json.JSONEncoder(self, obj)
