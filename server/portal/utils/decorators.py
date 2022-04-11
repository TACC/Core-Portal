"""
.. module:: portal.utils.decorators
   :synopsis: Decorator to be used across the portal.
"""

import logging
from functools import wraps
from django.http import JsonResponse
from portal.utils.jwt_auth import login_user_agave_jwt


logger = logging.getLogger(__name__)


def agave_jwt_login(func):
    """Decorator to login user with a jwt.

    If the request is already authenticated it means that Django has
    already gone through the trouble of checking the user's credentials
    and this decorator will not do anything.

    ..note::
        It will silently fail and continue executing the wrapped function
        if the JWT payload header IS NOT present in the request.
        If the JWT payload header IS present then it will continue executing
        the wrapped function passing the request object with the correct
        user logged-in. Because of the silent failure it is assumed that
        this decorator will be used together with the
        :func:`django.contrib.auth.decorators.login_required` decorator.
        This way we do not disrupt your usual Django login config.

    ..example::
        ```python
        @method_decorator(agave_jwt_login)
        @method_decorator(login_required)
        def post(self, request, **kwargs):
            pass
        ```
    """
    @wraps(func)
    def decorated_function(request, *args, **kwargs):
        """Decorated function."""
        login_user_agave_jwt(request)
        return func(request, *args, **kwargs)

    return decorated_function


def handle_uncaught_exceptions(message):
    """Decorator to handle any uncaught exceptions and provide a json error response

    If the view does not handle an exception, this decorator provides
    a json response with a 500 error code.

    :param str message: Error message for the json repsonse

    """
    def _decorator(fn):

        @wraps(fn)
        def wrapper(self, *args, **kw):
            try:
                return fn(self, *args, **kw)
            except Exception:
                logger.exception("Handling uncaught exception")
                return JsonResponse({'message': message}, status=500)
        return wrapper
    return _decorator
