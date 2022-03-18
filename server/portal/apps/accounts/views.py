"""
Accounts views.
"""
import logging
import json
import requests
from django.forms.models import model_to_dict
from django.conf import settings
from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string
from django.shortcuts import redirect
from pytas.http import TASClient

from portal.apps.accounts import integrations
from portal.apps.accounts import form_fields as forms
# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def accounts(request):
    response = redirect('/workbench/account/')
    return response


@login_required
def change_password(request):
    username = str(request.user)
    body = json.loads(request.body)
    current_password = body['currentPW']
    new_password = body['newPW']

    tas = TASClient(baseURL=settings.TAS_URL, credentials={'username': settings.TAS_CLIENT_KEY, 'password': settings.TAS_CLIENT_SECRET})
    auth = tas.authenticate(username, current_password)
    if auth:
        try:
            tas.change_password(username, current_password, new_password)
            return JsonResponse({'completed': True})
        except Exception as e:
            return JsonResponse({'message': e.args[1]}, status=422)
    else:
        return JsonResponse({'message': 'Incorrect Password'}, status=401)


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
        'licenses': manage_licenses(request),
        'integrations': manage_integrations(request),
    }

    return JsonResponse(context)


@login_required
def manage_licenses(request):
    from portal.apps.licenses.models import get_license_info
    licenses, license_models = get_license_info()
    licenses.sort(key=lambda x: x['license_type'])
    license_models.sort(key=lambda x: x.license_type)

    for l, m in zip(licenses, license_models):
        if m.objects.filter(user=request.user).exists():
            l['current_user_license'] = True
        l['template_html'] = render_to_string(l['details_html'])
    return licenses


@login_required
def manage_integrations(request):
    return integrations.get_integrations(request)


@login_required
def edit_profile(request):
    tas = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )
    user = request.user
    body = json.loads(request.body)
    portal_profile = user.profile
    if body['flag'] == 'Required':

        portal_profile.ethnicity = body['ethnicity']
        portal_profile.gender = body['gender']

        tas_user = tas.get_user(username=user)
        body['piEligibility'] = tas_user['piEligibility']
        body['source'] = tas_user['source']
        tas.save_user(tas_user['id'], body)
    elif body['flag'] == 'Optional':
        portal_profile.website = body['website']
        portal_profile.professional_level = body['professional_level']
        portal_profile.bio = body['bio']
        portal_profile.orcid_id = body['orcid_id']
    portal_profile.save()
    return JsonResponse({'portal': model_to_dict(portal_profile), 'tas': tas.get_user(username=user)})


@login_required
def get_form_fields(request):
    return JsonResponse({
        'institutions': [list(i) for i in forms.get_institution_choices()],
        'countries': [list(c) for c in forms.get_country_choices()],
        'titles': [list(t) for t in forms.USER_PROFILE_TITLES],
        'ethnicities': [list(e) for e in forms.ETHNICITY_OPTIONS],
        'genders': [list(g) for g in forms.GENDER_OPTIONS],
        'professionalLevels': [list(p) for p in forms.PROFESSIONAL_LEVEL_OPTIONS]
    })
