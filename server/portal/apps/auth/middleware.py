from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from django.contrib import auth
from django.http import HttpResponse
from portal.apps.auth.models import TapisOAuthToken
import logging


logger = logging.getLogger(__name__)


class TapisTokenRefreshMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = auth.get_user(request)
        if not (request.path in ['/logout/', '/login/']) and user.is_authenticated:
            try:
                TapisOAuthToken.objects.filter(user=user).get()
            except ObjectDoesNotExist:
                logger.error(f'Authenticated user {user.username} missing Tapis API Token')
                logout(request)
                return HttpResponse("Unauthorized", status=401)
        response = self.get_response(request)
        return response
