"""
.. module: portal.libs.agave.exceptions
    :synopsis: Exceptions for the agave
"""
from __future__ import unicode_literals, absolute_import
import logging

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


class ValidationError(Exception):
    """Validation error"""
    pass
