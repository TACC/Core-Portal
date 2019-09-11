"""
.. :module:: portal.libs.exceptions
    :synopsis: Exceptions defined for custom libs.
"""
from __future__ import unicode_literals, absolute_import
import logging

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


class PortalLibException(Exception):
    """Portal Lib Exception"""
    pass
