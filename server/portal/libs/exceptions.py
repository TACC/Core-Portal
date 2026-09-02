"""
.. :module:: portal.libs.exceptions
    :synopsis: Exceptions defined for custom libs.
"""
import logging

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


class PortalLibException(Exception):
    """Portal Lib Exception"""
    pass
