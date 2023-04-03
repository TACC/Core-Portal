"""
Accounts views.
"""
import logging
import requests

from django.forms.models import model_to_dict
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string
from django.shortcuts import redirect
from pytas.http import TASClient

from portal.apps.accounts import integrations
from portal.utils.decorators import handle_uncaught_exceptions

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def accounts(request):
    response = redirect('/workbench/account/')
    return response


def get_user_history(username):
    """
    Get user history from tas
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get('{0}/v1/users/{1}/history'.format(settings.TAS_URL, username), auth=auth)
    resp = r.json()
    if resp['status'] == 'success':
        return resp['result']
    else:
        raise Exception('Failed to get project users', resp['message'])


@handle_uncaught_exceptions(message="Unable to get profile.")
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
    context = {
        'demographics': demographics,
        'history': history,
        'licenses': _manage_licenses(request),
        'integrations': _manage_integrations(request),
    }

    return JsonResponse(context)


def _manage_licenses(request):
    from portal.apps.licenses.models import get_license_info
    licenses, license_models = get_license_info()
    licenses.sort(key=lambda x: x['license_type'])
    license_models.sort(key=lambda x: x.license_type)

    for license, m in zip(licenses, license_models):
        if m.objects.filter(user=request.user).exists():
            license['current_user_license'] = True
        license['template_html'] = render_to_string(license['details_html'])
    return licenses


def _manage_integrations(request):
    return integrations.get_integrations(request)

