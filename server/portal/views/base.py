"""
.. module:: views.base
   :synopsis: Base views to standardize error logging and handling.
"""
from __future__ import unicode_literals, absolute_import
import logging
from requests.exceptions import ConnectionError, HTTPError
from django.views.generic import View
from django.http import JsonResponse
from portal.exceptions.api import ApiException

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


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
        except ApiException as err:

            status = err.response.status_code
            message = err.response.reason
            extra = err.extra
            if status != 404:
                logger.error(
                    '%s: %s',
                    message,
                    err.response.text,
                    exc_info=True,
                    extra=extra
                )
            else:
                logger.info('Error %s', message, exc_info=True, extra=extra)
            return JsonResponse({'message': message}, status=400)
        except (ConnectionError, HTTPError) as err:
            status = err.response.status_code
            content = err.response.json()
            message = content.get("message", "Unknown Error")
            if status in [404, 403]:
                logger.warning(
                    '%s: %s',
                    message,
                    err.response.text,
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
                    err.response.text,
                    exc_info=True,
                    extra={
                        'username': request.user.username,
                        'session_key': request.session.session_key
                    }
                )
            return JsonResponse({'message': message}, status=status)
        except Exception as exc:  # pylint: disable=broad-except
            logger.error(exc, exc_info=True)
            return JsonResponse(
                {'message': "Something went wrong here..."},
                status=500
            )
