"""
Custom Accounts views.
"""
import logging
import json
import requests
from django.forms.models import model_to_dict
from django.contrib.auth import logout
from django.views.generic.base import View
from django.conf import settings
from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string
from pytas.http import TASClient

from core_apps_accounts import integrations
from core_apps_accounts import form_fields as forms
from core_apps_accounts.views import get_user_history
from core_apps_accounts.views import manage_licenses
from core_apps_accounts.views import manage_applications

logger = logging.getLogger(__name__)

## Now we can write some code to customize the profile data endpoint

@login_required
def get_profile_data(request):
    """
    JSON profile data
    """
    django_user = request.user
    tas = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )

    user_profile = tas.get_user(username=request.user.username)
    history = get_user_history(request.user.username)

    try:
        demographics = model_to_dict(django_user.profile)
    except ObjectDoesNotExist as e:
        demographics = {}
        logger.info('exception e:{} {}'.format(type(e), e))
    demographics.update(user_profile)
    ## let's customize what we return for the usual default demographics info
    ## Return only first and last initials
    demographics.update({'firstName':demographics['firstName'][0]})
    demographics.update({'lastName':demographics['lastName'][0]})
    ## Return the last 4 digits of the user's phone number
    demographics.update({'phone':demographics['phone'][-4:]})

    context = {
        'demographics': demographics,
        'history': history,
        'licenses': manage_licenses(request),
        'integrations': manage_applications(request),
    }

    return JsonResponse(context)
