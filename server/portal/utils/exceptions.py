"""
.. module:: portal.utils.exceptions
   :synopsis: Exceptions used across the portal
"""

import logging
from requests.exceptions import RequestException
from requests.models import Response

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


class PortalException(RequestException):
    """Base Exception to use across the portal.

    Use this to raise custom exceptions. It inherits from
    :class:`requests.exceptions.RequestException`.
    This class helps to use custom message and status codes as well as
    an ``extra`` dictionary object.
    The ``extra`` dictionary object will be passed into the logger.

    :param str message: Message of exception.
    :param int status: Status code of exception.
    :param dictextra: Extra information of exception.

    :Example:

    Raising an exception with a message, a status code and some extra information:
    >>> raise PortalException("Exception message",
    >>> 500, {'username': 'myusername'})

    Raising an exception based on a requests exception
    >>> except HTTPError as e:
    >>>     raise PortalException("New Exception message", request = e.request, response = e.response)

    """
    def __init__(self, message=None, status=None,
                 extra=None, *args, **kwargs):
        super(PortalException, self).__init__(*args, **kwargs)
        response = self.response or Response()
        response.status_code = status or response.status_code
        response.reason = message or response.reason
        self.message = message or response.reason
        self.response = response
        self.extra = extra


class ApiMethodNotAllowed(PortalException):
    """Custom 405 Method Not Allowed Exception"""
    def __init__(self, extra=None, *args, **kwargs):
        super(ApiMethodNotAllowed, self).__init__(
            message='Method Not Allowed',
            status=405,
            extra=extra
            )
