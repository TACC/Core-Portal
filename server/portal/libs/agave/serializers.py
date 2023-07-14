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
        elif isinstance(obj, list):
            for index, item in enumerate(obj):
                obj[index] = self._serialize(item)
        elif isinstance(obj, dict):
            for nk, nv in obj.items():
                obj[nk] = self._serialize(nv)
        return obj

    def default(self, obj):
        if isinstance(obj, (TapisResult, list, dict)):
            return self._serialize(obj)
        return json.JSONEncoder.encode(self, obj)
