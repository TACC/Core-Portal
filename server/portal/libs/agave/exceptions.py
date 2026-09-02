"""
.. module: portal.libs.agave.exceptions
    :synopsis: Exceptions for the agave
"""
import logging
from portal.libs.exceptions import PortalLibException

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


class ValidationError(PortalLibException):
    """Validation error"""
    pass


class CreationError(PortalLibException):
    """Creation Error"""
    pass


class DeletionError(PortalLibException):
    """Deletion Error"""
    pass


class APIError(PortalLibException):
    """API Error"""
    pass
