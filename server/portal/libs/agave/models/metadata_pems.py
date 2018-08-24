import json
import logging
from portal.libs.agave.models.base import BaseAgaveResource

logger = logging.getLogger(__name__)


class BaseMetadataPermissionResource(BaseAgaveResource):
    """
    Permissions object for a :class:`BaseMetadataResource`.
    """

    def __init__(self, metadata_uuid, agave_client, **kwargs):
        defaults = {
            'permission': {},
            'username': None
        }
        defaults.update(**kwargs)
        super(BaseMetadataPermissionResource, self).__init__(agave_client, **defaults)
        self.metadata_uuid = metadata_uuid

    @property
    def read(self):
        return self.permission.get('read', False)

    @read.setter
    def read(self, value):
        self.permission['read'] = value

    @property
    def write(self):
        return self.permission['write']

    @write.setter
    def write(self, value):
        self.permission['write'] = value

    @property
    def permission_bit(self):
        if self.read:
            if self.write:
                return 'ALL'
            else:
                return 'READ'
        elif self.write:
            return 'WRITE'

        return 'NONE'

    @permission_bit.setter
    def permission_bit(self, value):
        if value == 'READ':
            self.read = True
            self.write = False
        elif value == 'WRITE':
            self.read = False
            self.write = True
        elif value == 'READ_WRITE':
            self.read = True
            self.write = True
        elif value == 'ALL':
            self.read = True
            self.write = True
        elif value == 'NONE':
            self.read = False
            self.write = False

    @property
    def request_body(self):
        return json.dumps({
            'username': self.username,
            'permission': self.permission_bit
        })

    def save(self):
        """
        Persist this permission

        :return: self
        :rtype: :class:`BaseMetadataPermissionResource`
        """
        logger.info('Updating metadata permissions: {} {}'.format(self.metadata_uuid,
                                                                  self.request_body))
        result = self._agave.meta.updateMetadataPermissions(uuid=self.metadata_uuid,
                                                            body=self.request_body)
        self._wrapped.update(**result)
        return self

    def delete(self):
        """
        Delete this permission. Convenience method for setting read/write to False, then
        calling BaseMetadataPermission.save().

        :return: None
        """
        self.read = False
        self.write = False
        self.save()

    @classmethod
    def list_permissions(cls, metadata_uuid, agave_client):
        """
        Get the permissions for a metadata object
        :param metadata_uuid: string: the UUID of the metadata for which to list
            permissions
        :param agave_client: agavepy.Agave: API client instance

        :return: List of permissions for the passed Metadata UUID
        :rtype: list of designsafe.apps.api.agave.BaseMetadataPermission
        """
        records = agave_client.meta.listMetadataPermissions(uuid=metadata_uuid)
        return [cls(metadata_uuid, agave_client, **r) for r in records]
