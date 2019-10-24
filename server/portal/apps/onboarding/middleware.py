
from django.contrib import messages
from django.conf import settings
from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect
from portal.apps.accounts.models import PortalProfile
from portal.apps.notifications.models import Notification     

import logging

logger = logging.getLogger(__name__)

class SetupCompleteMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not reverse('workbench:index') in request.path:
            return self.get_response(request)
    
        if not hasattr(request, "user") or not request.user.is_authenticated():
            return HttpResponseRedirect(reverse('portal_accounts:logout'))

        user = request.user
        portal_profile = None

        try:
            # get the user profile
            portal_profile = user.profile
        except PortalProfile.DoesNotExist:
            # Log out the user if they somehow don't have a profile
            # It should be created by portal.apps.auth.backends.AgaveOAuthBackend.authenticate
            logout(request)
            return HttpResponseRedirect(reverse('portal_accounts:logout'))

        # check to see if user setup has finished
        if not portal_profile.setup_complete:
            return HttpResponseRedirect(reverse('portal_onboarding:holding'))

        response = self.get_response(request)
        return response