"""
.. module:: agave.models.base
   :synopsis: Base models to handle data coming from agave.
              Usually response from Agavepy which are dicts with jsonAttributes for keys.
"""
from __future__ import unicode_literals, absolute_import
import logging
import six
import json
import datetime
import copy
from .. import utils as AgaveUtils

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

class BaseAgaveResource(object): #pylint: disable=too-few-public-methods
    """
    Base Class to represent Agave Resources.

    This class implements basic wrapping capabilities for Agave Resources
    """
    def __init__(self, client, **kwargs):
        """This class will allow easy access to a JSON object which has been
        converted into a dictionary.

        :param client: :class:`~agave.agavepy.Agave` client

        .. note:: Every parameter given other than :param:`client` will be
        internally stored in ``_wrapped``.
        .. note:: Nested objects will also be wrapped in this class. This way
        we can access nested objects like so: ``agave_res.value.title``.
        .. note:: Attributes can be access using snake_case or lowerCamelCase.
        """
        self._ac = client
        self._wrapped = kwargs

    def __getattribute__(self, name):
        """Custom attribute getter for correct translation

        snake_case to lowerCamelCase translation happens here as well
        as wrapping nested objects in this class"""

        camel_name = AgaveUtils.to_camel_case(name)
        _wrapped = object.__getattribute__(self, '_wrapped')
        if camel_name not in _wrapped:
            return object.__getattribute__(self, name)

        val = _wrapped.get(camel_name)
        if isinstance(val, dict):
            if 'self' in val:
                _self = val.pop('self')
                val['_self'] = copy.deepcopy(_self)
            return BaseAgaveResource(client=self._ac, **val)

        return val

    def __setattr__(self, name, value):
        if name not in ['_wrapped', '_ac']:
            camel_name = AgaveUtils.to_camel_case(name)
            if camel_name in self._wrapped:
                self._wrapped[camel_name] = value
                return

        super(BaseAgaveResource, self).__setattr__(name, value)

    def to_dict(self):
        try:
            pop = getattr(self, '_populate_obj')
            pop()
        except AttributeError:
            pass

        dict_obj = {}
        for key in list(self._wrapped):
            val = getattr(self, key)
            if isinstance(val, datetime.datetime):
                val = val.isoformat()
            elif isinstance(val, BaseAgaveResource):
                val = val.to_dict()

            dict_obj[key] = val
        return dict_obj
