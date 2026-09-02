"""
.. module:: views.base
   :synopsis: Base views to standardize error logging and handling.
"""

import logging
from requests.exceptions import ConnectionError, HTTPError
from django.views.generic import View
from django.http import JsonResponse, Http404
from django.core.exceptions import PermissionDenied
from portal.exceptions.api import ApiException
from tapipy.errors import BaseTapyException

logger = logging.getLogger(__name__)


class BaseApiView(View):
    """Base api view to centralize error logging."""

    def dispatch(self, request, *args, **kwargs):
        """Overwriting dispatch to catch errors.

        If the error catched is an instance of
        :class:`~portal.exceptions.api.ApiException` then the ``extra``
        dictionary will be sent to the logger. This allows extra information
        to be available in the logs and in Opbeat's UI.
        """
        try:
            return super(BaseApiView, self).dispatch(request, *args, **kwargs)
        except (PermissionDenied, Http404) as e:
            # log information but re-raise exception to let django handle response
            logger.error(e, exc_info=True)
            raise e
        except ApiException as e:
            status = e.response.status_code
            message = e.response.reason
            extra = e.extra
            if status != 404:
                logger.error(
                    '%s: %s',
                    message,
                    e.response.text,
                    exc_info=True,
                    extra=extra
                )
            else:
                logger.info('Error %s', message, exc_info=True, extra=extra)
            return JsonResponse({'message': message}, status=400)
        except (ConnectionError, HTTPError, BaseTapyException) as e:
            # status code and json content from ConnectionError/HTTPError exceptions
            # are used in the returned response. Note: the handling of these two exceptions
            # is significant as client-side code make use of these status codes (e.g. error
            # responses from tapis are used to determine a tapis storage systems does not exist)
            status = 500
            if e.response is not None:
                status = e.response.status_code
                try:
                    content = e.response.json()
                    message = content.get("message", "Unknown Error")
                except ValueError:
                    message = "Unknown Error"
                if status in [404, 403]:
                    logger.warning(
                        '%s: %s',
                        message,
                        e.response.text,
                        exc_info=True,
                        extra={
                            'username': request.user.username,
                            'session_key': request.session.session_key
                        }
                    )
                else:
                    logger.error(
                        '%s: %s',
                        message,
                        e.response.text,
                        exc_info=True,
                        extra={
                            'username': request.user.username,
                            'session_key': request.session.session_key
                        }
                    )
            else:
                logger.error(
                    e,
                    exc_info=True,
                    extra={
                        'username': request.user.username,
                        'session_key': request.session.session_key
                    }
                )
                message = str(e)
            return JsonResponse({'message': message}, status=status)
        except Exception as e:  # pylint: disable=broad-except
            logger.error(e, exc_info=True)
            return JsonResponse(
                {'message': "Something went wrong here..."},
                status=500)
