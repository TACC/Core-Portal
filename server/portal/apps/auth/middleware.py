from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from requests.exceptions import RequestException, HTTPError
from django.contrib import auth
from django.db import transaction
from django.http import HttpResponse
from portal.apps.auth.models import AgaveOAuthToken
import logging

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def get_user(request):
    if not hasattr(request, '_cached_user'):
        request._cached_user = auth.get_user(request)
    return request._cached_user


class AgaveTokenRefreshMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = get_user(request)
        try:
            if request.path != '/logout/' and user.is_authenticated:
                try:
                    with transaction.atomic():
                        agave_oauth = AgaveOAuthToken.objects.filter(user=user).select_for_update().get()
                        if agave_oauth.expired:
                            try:
                                agave_oauth.client.token.refresh()
                            except HTTPError:
                                raise Exception(
                                    'Agave Token refresh failed; Forcing logout for {}'.format(user.username)
                                )
                except ObjectDoesNotExist:
                    raise Exception('Authenticated user {} missing Agave API Token'.format(user.username))
                except RequestException:
                    raise Exception('Agave Token refresh failed. Forcing logout for {}'.format(user.username))

        except Exception as e:
            logger.exception(e)
            logout(request)
            return HttpResponse("Unauthorized", status=401)

        response = self.get_response(request)
        return response
