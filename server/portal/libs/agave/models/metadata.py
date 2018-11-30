"""
.. :module:: portal.libs.agave.models.metadata
   :synopsis: Classes to represent Agave Metadata
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
from cached_property import cached_property_with_ttl
from portal.libs.agave.exceptions import (
    ValidationError,
    CreationError,
    DeletionError
)
from portal.libs.agave.models.base import BaseAgaveResource
from portal.libs.agave.models.permissions import MetadataPermissions

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


# pylint:disable=too-many-instance-attributes
class Metadata(BaseAgaveResource):
    """Agave metadata record representation."""

    _body_fields = [
        'uuid',
        'schema_id',
        'internal_username',
        'association_ids',
        'last_updated',
        'name',
        'created',
        'owner',
        'value'
    ]

    value_cls = BaseAgaveResource

    def __init__(self, client, load=True, uuid=None, **kwargs):
        """Agave metadata record representation.

        This class only defines the basic metadata fields, in order
        to define custom metadata objects this class should be subclassed.
        """
        wrapped = {}
        if uuid is not None and load:
            wrapped = client.meta.getMetadata(
                uuid=uuid
            )
        value = self.value_cls(
            client,
            **kwargs.pop('value', {})
        )

        wrapped.update(**kwargs)

        super(Metadata, self).__init__(client, uuid=uuid, **wrapped)

        self.value = value
        self.uuid = getattr(self, 'uuid', None)
        self.schema_id = getattr(self, 'schema_id', None)
        self.internal_username = getattr(self, 'internal_username', None)
        self.association_ids = getattr(self, 'association_ids', [])
        self.last_updated = getattr(self, 'last_updated', None)
        self.name = getattr(self, 'name', None)
        self.created = getattr(self, 'created', None)
        self.owner = getattr(self, 'owner', None)
        self._links = getattr(self, '_links', None)

    @cached_property_with_ttl(ttl=60*15)
    def permissions(self):
        """Permissions"""
        pems = self._ac.meta.listMetadataPermissions(uuid=self.uuid)
        return MetadataPermissions(self._ac, pems, self)

    def __str__(self):
        return '{name}: {uuid}'.format(name=self.name, uuid=self.uuid)

    def __repr__(self):
        return '{class_name}(name={name},uuid={uuid}'.format(
            class_name=self.__class__.__name__,
            name=self.name,
            uuid=self.uuid
        )

    def _populate_obj(self):
        """Populate Object.

        Object should always be populated when instantiated.
        """
        pass

    @staticmethod
    def remove(client, uuid):
        """Removes a metadata record.

        :param client: Agave client.
        :param str uuid: Metadata record uuid.
        """
        return client.meta.deleteMetadata(uuid)

    @classmethod
    def create(cls, client, meta_dict):
        """Creates a metadata record.

        :param client: Agave client.
        :param dict meta_dict: `dict` representing metadata record.
        """
        if meta_dict.get('uuid') is not None:
            raise CreationError(
                "Cannot specify \"uuid\" if creating metadata record. "
                "\"uuid\" must be \"None\"."
            )
        resp = client.meta.addMetadata(body=meta_dict)
        return cls(client, **resp)

    @classmethod
    def from_dict(cls, client, dict_obj):
        """Initialize metadata from dictionary.

        :param client: Agave client
        :param dict dict_obj: Dictionary object
        """
        return cls(client, load=False, **dict_obj)

    @classmethod
    def search(cls, client, search, offset=0, limit=100):
        """Search metadata record.

        :param client: Agave client
        :param dict search: MongoDB like search
        """
        resp = client.meta.listMetadata(
            privileged=True,
            q=json.dumps(search),
            offset=offset,
            limit=limit
        )
        for meta in resp:
            yield cls.from_dict(client, meta)

    def delete(self):
        """Delete this metadata record.

        .. note:: This method differs from :meth:`remove` in that it will
            remove the metadata record this class represents. :meth:`remove`
            is a static method meant to be used when it is not necessary to
            instantiate a metadata record to delete it, i.e. when we can get
            the metadata uuid easily.
        """
        if self.uuid is None:
            raise DeletionError(
                "Must specify \"uuid\" to delete metadata record"
            )
        res = self._ac.meta.deleteMetadata(
            uuid=self.uuid
        )
        return res

    def update(self):
        """Update a metadata record."""
        self.validate()
        self._ac.meta.updateMetadata(
            uuid=self.uuid,
            body=self.to_dict()
        )

    def validate_name(self):
        """Validate self.name"""
        if not self.name:
            raise ValidationError(
                "Metadata record must have a name"
                )

    def save(self):
        """Save this metadata record."""
        self._ac.meta.addMetadata(
            body=self.to_dict()
        )
