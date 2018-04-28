"""
.. module: portal.libs.agave.models.systems.storage
   :synopsis: Models representing systems in Agave.
"""
from __future__ import unicode_literals, absolute_import
# from collections import namedtuple
import logging
from future.utils import python_2_unicode_compatible
# import requests
# from django.conf import settings
from portal.libs.agave.exceptions import ValidationError
from portal.libs.agave.models.systems.base import BaseSystem

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


@python_2_unicode_compatible  # pylint: disable=too-many-instance-attributes
class StorageSystem(BaseSystem):
    """Agave Storage System representation

    .. note::
        Schema: https://agavepy.readthedocs.io/en/latest/agavepy.systems.html
    """
    _body_fields = [
        'owner',
        'available',
        'description',
        'type',
        'uuid',
        'revision',
        'site',
        'default',
        'public',
        'global_default',
        'name',
        'id',
        'status',
        'storage'
    ]

    # pylint: disable=redefined-builtin
    def __init__(self, client, id, **kwargs):
        super(StorageSystem, self).__init__(
            client,
            id=id,
            type=BaseSystem.TYPES.STORAGE,
            **kwargs
        )
        self.owner = getattr(self, 'owner', None)
        self._links = getattr(self, '_links', {})
        self.available = getattr(self, 'available', True)
        self.description = getattr(self, 'description', '')
        self.type = getattr(self, 'type', BaseSystem.TYPES.STORAGE)
        self.uuid = getattr(self, 'uuid', None)
        self.revision = getattr(self, 'revision', None)
        self.site = getattr(self, 'site', None)
        self.default = getattr(self, 'default', False)
        self.public = getattr(self, 'public', False)
        self.global_default = getattr(self, 'globalDefault', False)
        self.name = getattr(self, 'name', None)
        self.id = id  # pylint: disable=invalid-name
        self.last_modified = getattr(self, 'lastModified', None)
        self.status = getattr(self, 'status', 'UP')
        self.storage = getattr(self, 'storage', None)

    def validate_type(self):
        """Validate self.type"""
        if self.type != BaseSystem.TYPES.STORAGE:
            raise ValidationError(
                "Storage system type must be {storage_type}".format(
                    storage_type=BaseSystem.TYPES.STORAGE
                )
            )

    def validate_owner(self):
        """Validate self.owner"""
        pass

    def validate_available(self):
        """validate self.available"""
        if not isinstance(self.available, bool):
            raise ValidationError(
                "'available' should be of type 'bool'"
            )

    def validate_description(self):
        """Validate self.description"""
        pass

    def validate_uuid(self):
        """Validate self.uuid"""
        pass

    def validate_revision(self):
        """Validate self.revision"""
        pass

    def validate_site(self):
        """Validate self.site"""
        pass

    def validate_default(self):
        """Validate self.default"""
        if not isinstance(self.default, bool):
            raise ValidationError(
                "'default' should be of type 'bool'"
            )

    def validate_public(self):
        """Validate self.public"""
        if not isinstance(self.public, bool):
            raise ValidationError(
                "'public' should be of type 'bool'"
            )

    def validate_global_default(self):
        """Validate self.default"""
        if not isinstance(self.global_default, bool):
            raise ValidationError(
                "'global_default' should be of type 'bool'"
            )

    def validate_name(self):
        """Validat self.name"""
        if not self.name:
            raise ValidationError(
                "'name' should not be empty"
            )

    def validate_id(self):
        """Validate self.id"""
        if not self.id:
            raise ValidationError(
                "'id' should not be empty"
            )

    def validate_status(self):
        """Validate self.status"""
        statuses = ['UP', 'DOWN', 'UNKNOWN']
        if self.status not in statuses:
            raise ValidationError(
                "'status' should be one of: {statuses}".format(
                    statuses=statuses
                )
            )
