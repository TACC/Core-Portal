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

    ..note::
        Schema: https://agavepy.readthedocs.io/en/latest/agavepy.systems.html
    """

    EXECUTION_TYPES = namedtuple(
        'ExecutionTypes', ['HPC', 'CONDOR', 'CLI'])(
            HPC='HPC', CONDOR='CONDOR', CLI='CLI')

    def __init__(self, client, id=id, **kwargs):
        super(BaseSystem, self).__init__(
            client, id=id, **kwargs)
        self.id = id
        self.description = getattr(self, 'description', '')
        self.environment = getattr(self, 'environment', None)
        self.execution_type = getattr(self, 'execution_type',
                                      self.EXECUTION_TYPES.HPC)
        self.login = getattr(self, 'login', {})
