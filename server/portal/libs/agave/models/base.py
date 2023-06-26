"""
.. module:: agave.models.base
   :synopsis: Base models to handle data coming from agave.
              Usually response from Agavepy which are dicts with
              jsonAttributes for keys.
"""
import logging
import datetime
import copy
from portal.libs.agave import utils as AgaveUtils

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class BaseAgaveResource(object):  # pylint: disable=too-few-public-methods
    """Base Class to represent Agave Resources.

    This class implements basic wrapping capabilities for Agave Resources
    """

    def __init__(self, client, **kwargs):
        """This class will allow easy access to a JSON object which has been
        converted into a dictionary.

        :param client: :class:`~agave.agavepy.Agave` client

        .. note::
            Every parameter given other than :param:`client` will be
        internally stored in ``_wrapped``.
        .. note::
            Nested objects will also be wrapped in this class. This way
        we can access nested objects like so: ``agave_res.value.title``.
        .. note:: Attributes can be access using snake_case or lowerCamelCase.
        """
        self._ac = client
        self._wrapped = kwargs

    def __getattribute__(self, name):
        """Custom attribute getter for correct translation

        `snake_case` to `lowerCamelCase` translation happens here as well
        as wrapping nested objects in this class.

        :Example:

        >>> client = user.tapis_oauth.client
        >>> obj = BaseAgaveResource(
        ...     client,
        ...     {
        ...         "name": "obj.name",
        ...         "value": {"customField": "custom_value"}
        ...     }
        >>> obj.name
        ... "obj.name"
        >>> obj.value.custom_field
        ... "custom_value"

        .. note::
            If the value being accessed is a json object (nested)
            we will create an internal object and save it using
            `__{attribute_name}}` attribute. This way you can access
            nested objects as if it were a native python object.

        .. todo::
            This is not going to enable autocompletion in most IDEs
            we could implement `__dir__` to return the keys from the
            wrapped object, although thta's still going to return
            the correct set of attributes only when it is instantiated.
            It is probably better to create a Metaclass to take care of this
            and explicitly show the attributes expected.
        """

        camel_name = AgaveUtils.to_camel_case(name)
        try:
            _wrapped = object.__getattribute__(self, '_wrapped')
        except AttributeError:
            _wrapped = {}

        if camel_name not in _wrapped:
            return object.__getattribute__(self, name)

        val = _wrapped.get(camel_name)
        if isinstance(val, dict):
            try:
                internal = object.__getattribute__(
                    self,
                    '__{name}'.format(name=name),
                )
                return internal
            except AttributeError:
                pass

            if 'self' in val:
                _self = val.pop('self')
                val['_self'] = copy.deepcopy(_self)
            internal = BaseAgaveResource(client=self._ac, **val)
            object.__setattr__(
                self,
                '__{name}'.format(name=name),
                internal
            )
            return internal

        return val

    def __setattr__(self, name, value):
        if name not in ['_wrapped', '_ac']:
            camel_name = AgaveUtils.to_camel_case(name)
            if camel_name in self._wrapped:
                self._wrapped[camel_name] = value
                return

        object.__setattr__(self, name, value)

    def to_dict(self):
        """To dict"""
        try:
            populate = getattr(self, '_populate_obj')
            populate()
        except AttributeError:
            pass

        dict_obj = {}
        keys = getattr(
            self,
            '_body_fields',
            list(self._wrapped)
        )
        for key in keys:
            val = getattr(self, key)
            if isinstance(val, datetime.datetime):
                val = val.isoformat()
            elif (isinstance(val, BaseAgaveResource) or
                  hasattr(val, 'to_dict')):
                val = val.to_dict()

            camel_case_key = AgaveUtils.to_camel_case(key)
            dict_obj[camel_case_key] = val
        return dict_obj

    def validate(self):
        """Validate object

        Method to valide object is correct.
        This should be used before creation/update to make sure
        things will not break.
        """
        for fieldname in getattr(self, '_body_fields', []):
            val_name = 'validate_{fieldname}'.format(fieldname=fieldname)
            field = getattr(self, fieldname)
            val = getattr(self, val_name, None)
            if val is not None:
                val()
            elif isinstance(
                    field,
                    BaseAgaveResource
            ):
                field.validate()
