import json
import logging
from portal.libs.agave.models.base import BaseAgaveResource

logger = logging.getLogger(__name__)


class BaseMetadataResource(BaseAgaveResource):
    """
    Base class for Agave Metadata objects. Can be subclassed to add application-specific
    business logic.
    """

    def __init__(self, agave_client, **kwargs):
        defaults = {
            'uuid': None,
            'schemaId': None,
            'associationIds': [],
            'name': None,
            'value': {}
        }
        defaults.update(kwargs)
        super(BaseMetadataResource, self).__init__(agave_client, **defaults)

    @property
    def request_body(self):
        """
        Creates an appropriate representation of this metadata object for persisting to
        the API backend

        :return: JSON representation suitable for persistence
        :rtype: string
        """
        return json.dumps({
            "schemaId": self.schemaId,
            "associationIds": self.associationIds,
            "name": self.name,
            "value": self.value
        })

    def fetch(self):
        result = self._agave.meta.getMetadata(uuid=self.uuid)
        self._wrapped.update(result)
        return self

    def save(self):
        """
        Saves or updates this metadata record.

        :return: self
        :rtype: :class:`BaseMetadataResource`
        """
        if self.uuid is None:
            logger.info('Saving "{}" metadata: {}'.format(self.name, self.request_body))
            result = self._agave.meta.addMetadata(body=self.request_body)
        else:
            logger.info('Updating "{}" metadata {}: {}'.format(self.name, self.uuid,
                                                               self.request_body))
            result = self._agave.meta.updateMetadata(uuid=self.uuid,
                                                     body=self.request_body)
        self._wrapped.update(**result)
        return self

    def delete(self):
        logger.info('Deleting "{}" metadata {}'.format(self.name, self.uuid))
        self._agave.meta.deleteMetadata(uuid=self.uuid)
        return self

    @classmethod
    def from_uuid(cls, agave_client, uuid):
        result = agave_client.meta.getMetadata(uuid=uuid)
        return cls(agave_client=agave_client, **result)
