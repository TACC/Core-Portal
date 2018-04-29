"""
.. module: portal.exceptions.api
   :synopsis: Exceptions used within the API
"""
from __future__ import unicode_literals, absolute_import
from requests.exceptions import RequestException
from requests.models import Response


class ApiException(RequestException):
    """Custom exceptions to be used within the API based on
     :class:`~requests.exceptions.RequestException`

    This class is meant to extend the basic
    :class:`~requests.exceptions.RequestException` and add
    the ability to add extra information.

    .. rubric:: Rationale

    It is better to raise custom exceptions when
    implementing an API to easily differentiate
    exceptions raise by our code and those exceptions
    raised by external libraries.
    By adding the ability to add extra
    information we can send more context to the logger.

    """

    def __init__(
            self,
            message=None,
            status=None,
            extra=None,
            *args,
            **kwargs
    ):
        """Custom exception based on
           :class:`~requests.exceptions.RequestException`

        :param str message: Exception message.
        :param int status: HTTP status code.
        :param dict extra: Extra information to send.

        :Example:

        An exception can be created from a requests exception:
        >>> except HTTPError as err:
        >>>     raise ApiException(
        ...         "Message",
        ...         request=err.request,
        ...         response=e.response
        ...     )
        """
        super(ApiException, self).__init__(*args, **kwargs)
        response = self.response or Response()
        response.status_code = status or response.status_code
        response.reason = message or response.reason
        self.message = message or response.reason
        self.response = response
        self.extra = extra or {}
