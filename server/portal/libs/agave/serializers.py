"""
.. module: libs.agave.serializers
   :synopsis: Necessary classes to serialize a class which
    wrapps an agave object into a dict.
"""
import logging
import json
import datetime
import six
from tapipy.tapis import TapisResult
from .models.base import BaseAgaveResource

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class BaseAgaveFileSerializer(json.JSONEncoder):
    """Class to serialize an Agave Resource object
    """
    def default(self, obj):  # pylint: disable=method-hidden, arguments-differ
        if isinstance(obj, BaseAgaveResource):
            _wrapped = obj.to_dict()  # pylint: disable=protected-access
            for key, val in six.iteritems(_wrapped):
                if isinstance(val, datetime.datetime):
                    _wrapped[key] = val.isoformat()

            try:
                # pylint: disable=protected-access
                if obj._children is not None:
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


class BaseAgaveSystemSerializer(json.JSONEncoder):
    """Class to serialize an Agave System object"""
    def default(self, obj):  # pylint: disable=method-hidden, arguments-differ
        if (isinstance(obj, BaseAgaveResource) or
                hasattr(obj, 'to_dict')):
            _wrapped = obj.to_dict()
            if isinstance(_wrapped, list):
                return _wrapped

            for key, val in six.iteritems(_wrapped):
                if isinstance(val, datetime.datetime):
                    _wrapped[key] = val.isoformat()
            return _wrapped

        return json.JSONEncoder(self, obj)


class BaseAgaveMetaSerializer(json.JSONEncoder):
    """Class to serialize an Agave System object"""
    def default(self, obj):  # pylint: disable=method-hidden, arguments-differ
        if (isinstance(obj, BaseAgaveResource) or
                hasattr(obj, 'to_dict')):
            _wrapped = obj.to_dict()
            if isinstance(_wrapped, list):
                return _wrapped

            for key, val in six.iteritems(_wrapped):
                if isinstance(val, datetime.datetime):
                    _wrapped[key] = val.isoformat()
            return _wrapped

        return json.JSONEncoder(self, obj)


class BaseTapisResultSerializer(json.JSONEncoder):
    """Class to serialize a Tapis response object"""

    def _serialize(self, obj):
        if isinstance(obj, TapisResult):
            _wrapped = vars(obj)
            for k, v in _wrapped.items():
                if isinstance(v, TapisResult):
                    _wrapped[k] = self._serialize(v)
                elif isinstance(v, list):
                    for index, item in enumerate(v):
                        v[index] = self._serialize(item)
                elif isinstance(v, dict):
                    for nk, nv in v.items():
                        v[nk] = self._serialize(nv)
            return _wrapped
        return obj

    def default(self, obj):
        if isinstance(obj, TapisResult):
            return self._serialize(obj)
        return json.JSONEncoder.encode(self, obj)
