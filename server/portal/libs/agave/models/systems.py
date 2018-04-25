"""
.. module: portal.libs.agave.models.files
   :synopsis: Models representing systems in Agave.
"""
from __future__ import unicode_literals, absolute_import
from collections import namedtuple
import logging
from future.utils import python_2_unicode_compatible
import requests
from django.conf import settings
from .base import BaseAgaveResource

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


@python_2_unicode_compatible
class BaseSystem(BaseAgaveResource):
    """Agave System representation

    .. note::
        Schema: https://agavepy.readthedocs.io/en/latest/agavepy.systems.html
    .. todo::
        This class should create a better API
    """

    EXECUTION_TYPES = namedtuple(
        'ExecutionTypes', ['HPC', 'CONDOR', 'CLI'])(
            HPC='HPC', CONDOR='CONDOR', CLI='CLI')
    TYPES = namedtuple(
        'SystemTypes', ['STORAGE', 'EXECUTION'])(
            STORAGE='STORAGE', EXECUTION='EXECUTION')

    # pylint:disable=redefined-builtin
    def __init__(self, client, id='', **kwargs):
        super(BaseSystem, self).__init__(
            client,
            id=id,
            **kwargs
        )

    @classmethod
    def create(cls, client, body):
        """Create a system

        :param dict body: System definition
        """
        resp = client.add(body=body)
        return cls(client, **resp)

    @classmethod
    def search(cls, client, query):
        """Search systems

        This is using the Agave `systems.search` directly.
        The query is a dictionary where each key is a Mongo-like search query
        using the value of the key.

        :Example:

            >>> systems = BaseSystem.search(
            ...     client,
            ...     {
            ...         'type.eq': BaseSystem.TYPES.STORAGE,
            ...         'id.like': 'cep.project.*'
            ...     }
            ... )
            >>> print systems
            ... [{'type': 'STORAGE', 'id': 'cep.project.123123-123-012'}, ...]

        :param client: Agave client to use
        :param dict queyr: Query to use

        :return list: A list of system objects

        .. seealso:: `systems-search --help`
        """
        if client.token:
            token = client.token.token_info['access_token']
        else:
            token = client._token  # pylint: disable=protected-access

        headers = {'Authorization': 'Bearer {token}'.format(token=token)}
        resp = requests.get(
            '{baseurl}/systems/v2'.format(
                baseurl=settings.AGAVE_TENANT_BASEURL),
            headers=headers,
            params=query
        )
        resp.raise_for_status()
        systems = resp.json()['response']
        return systems

    def _populate_obj(self):
        """Fully populates object.

        This is used because we do not fully populate
        a system object when instantiating, this is
        to save calls to Agave. Since some actions only
        require ``id`` then we do not have to waste time
        in fully populating the object. We check if the
        object is populated by the presence of the `_links` value.

        :return: Self for chainability
        :rtype: :class:`BaseSystem`
        """
        if getattr(self, '_links', None) is None:
            res = self._ac.systems.get(systemId=self.id)
            self._wrapped = res
        return self

    def _update(self):
        """Updates a system"""
        self._ac.systems.update(
            systemId=self.id,
            body=self.to_dict()
        )

    def set_login_keys(self, username, priv_key, pub_key):
        """Set SSH keys for login in a system"""
        wrap = self.to_dict()
        wrap['login']['auth'] = {
            'username': username,
            'privateKey': priv_key,
            'publicKey': pub_key,
            'type': 'SSHKEYS'
        }
        self._update()
        return self

    def set_storage_keys(self, username, priv_key, pub_key):
        """Set SSH keys for storage login in a system"""
        self._populate_obj()
        # pylint: disable=protected-access
        self.storage.auth._wrapped['username'] = username
        self.storage.auth._wrapped['privateKey'] = priv_key
        self.storage.auth._wrapped['publicKey'] = pub_key
        # pylint: enable=protected-access
        self.storage.auth.type = 'SSHKEYS'
        self._update()
        self.storage.auth.private_key = ''
        return self
