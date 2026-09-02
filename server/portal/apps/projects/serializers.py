"""Projects Serializers.

.. module:: portal.apps.projects.serializers
   :synopsis: Serializer classes for project objects.
"""
import logging
import datetime
import json
from django.contrib.auth import get_user_model
from portal.apps.projects.models.metadata import LegacyProjectMetadata
from portal.libs.agave.utils import to_camel_case

LOGGER = logging.getLogger(__name__)

# pylint: disable=redefined-builtin, invalid-name
all = ['MetadataJSONSerializer']


def _seralize_user(user):
    """Help method to serialize a user object.

    :param user: User model instance.
    """
    return {
        'last_name': user.last_name,
        'first_name': user.first_name,
        'email': user.email,
        'username': user.username
    }


class MetadataJSONSerializer(json.JSONEncoder):
    """JSON serializer for project metadata model."""

    def default(self, obj):  # pylint: disable=method-hidden, arguments-differ
        """Default."""
        if isinstance(obj, LegacyProjectMetadata):
            ret = {}
            for field in obj._meta.fields:
                if not field.serialize:
                    continue
                attname = to_camel_case(field.attname)
                val = field.value_from_object(obj)
                if isinstance(val, datetime.datetime):
                    ret[attname] = val.isoformat()
                elif (
                        field.remote_field and
                        field.remote_field.model is get_user_model()
                ):
                    # is a foreignkey field to UserModel.
                    attname = to_camel_case(field.name)
                    related = getattr(obj, field.name)
                    ret[attname] = None
                    if related is not None:
                        ret[attname] = _seralize_user(related)
                else:
                    if val is None:
                        ret[attname] = None
                    else:
                        ret[attname] = field.value_to_string(obj)
            for field in obj._meta.many_to_many:
                if not field.serialize:
                    continue
                attname = to_camel_case(field.name)
                related = getattr(obj, field.name)
                if field.remote_field.model is get_user_model():
                    ret[attname] = [
                        _seralize_user(user) for user in
                        related.iterator()
                    ]
                else:
                    ret[attname] = field.value_to_string(obj)
            return ret
        return super(MetadataJSONSerializer, self).default(obj)
