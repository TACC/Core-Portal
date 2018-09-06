"""Exceptions for projects.

.. module:: portal.apps.projects.execeptions
   :synopsis: Exception classes for projects.
"""
from __future__ import unicode_literals, absolute_import
import logging
from portal.exceptions.api import ApiException


LOGGER = logging.getLogger(__name__)


class NotAuthorizedError(ApiException):  # pylint:disable=too-many-ancestors
    """Not Authorized Error.

    This should be raised whenever a user tries to do
    something it's not supposed to.
    """

    def __init__(
            self,
            message=None,
            status=None,
            extra=None,
            **kwargs
    ):
        """Exception based on :class:`~requests.exceptions.RequestException`.

        :param str message: Exception message.
        :param int status: HTTP status code.
        :param dict extra: Extra information to send.
        """
        msg = "User is not Authorized."
        sts = 401
        super(NotAuthorizedError, self).__init__(
            message=message or msg,
            status=status or sts,
            extra=extra,
            **kwargs
        )
