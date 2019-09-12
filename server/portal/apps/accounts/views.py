"""
Accounts views.
"""
import logging
from django.contrib.auth import logout
from django.views.generic.base import View
from django.conf import settings
from django.http import HttpResponseRedirect


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class LogoutView(View):
    """Logout view
    """
    def get(self, request):
        """GET"""
        logout(request)
        return HttpResponseRedirect(settings.LOGIN_REDIRECT_URL)
