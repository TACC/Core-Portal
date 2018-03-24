"""
.. module: portal.libs.agave.models.files
   :synopsis: Models representing systems in Agave.
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import urlparse
import urllib
from collections import namedtuple
import requests
from requests.exceptions import HTTPError
from cached_property import cached_property
from django.conf import settings
from .base import BaseAgaveResource

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name

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

    def __init__(self, client, id=id, **kwargs):
        super(BaseSystem, self).__init__(
            client, id=id, **kwargs)

    @classmethod
    def create(cls, client, body):
        """Create a system

        :param dict body: System definition
        """
        resp = client.add(body=body)
        return cls(client, **resp)

    @classmethod
    def search(cls, client, query):
        if client.token:
            token = client.token.token_info['access_token']
        else:
            token = client._token

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
