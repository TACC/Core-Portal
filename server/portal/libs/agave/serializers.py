"""
.. module: libs.agave.serializers
   :synopsis: Necessary classes to serialize a class which wrapps an agave object into a dict.
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
import datetime
import six
from .models.base import BaseAgaveResource

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class BaseAgaveSerializer(json.JSONEncoder):
    """Class to serialize an Agave Resource object
    """
    def default(self, obj):#pylint: disable=method-hidden
        if isinstance(obj, BaseAgaveResource):
            _wrapped = obj.to_dict()#pylint: disable=protected-access
            for key, val in six.iteritems(_wrapped):
                if isinstance(val, datetime.datetime):
                    _wrapped[key] = val.isoformat()

            try:
                if obj._children:
                    kids = []
                    for child in obj.children():
                        tmp = child.to_dict()
                        tmp["trail"] = [
                            {
                                'system': t.system,
                                'path': t.path,
                                'name': t.name
                            } for t in child.trail]
                        kids.append(tmp)
                    _wrapped["children"] = kids

                _wrapped['trail'] = [
                    {
                        'system': trl.system,
                        'path': trl.path,
                        'name': trl.name
                    } for trl in obj.trail]
                # _wrapped["trail"] = obj.trail
            except AttributeError:
                pass
            return _wrapped

        return json.JSONEncoder(self, obj)
