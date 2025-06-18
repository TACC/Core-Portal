"""
Accounts views.
"""
import logging
import requests

from django.forms.models import model_to_dict
from django.conf import settings
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LogoutView as DjangoLogoutView
from django.contrib.auth import logout
from django.core.exceptions import ObjectDoesNotExist
from django.template.loader import render_to_string
from django.shortcuts import redirect
from pytas.http import TASClient

from portal.apps.accounts import integrations
from portal.utils.decorators import handle_uncaught_exceptions
from portal.apps.auth.models import TapisOAuthToken

logger = logging.getLogger(__name__)


class LogoutView(DjangoLogoutView):
    def dispatch(self, request, *args, **kwargs):
        # Get the token from the request 
        token = TapisOAuthToken.access_token
        if token:
            logger.info('???'*999)
            logger.info(vars(token))
            # logger.info(request.user.tapis_oauth.access_token)
            # self.revoke_token(token)

        # Log out the user
        logout(request)

        # Return response
        return JsonResponse({'detail': 'Logged out and token revoked'}, status=200)

    def revoke_token(self, token):
        revoke_endpoint = settings.TOKEN_REVOKE_ENDPOINT  # e.g., 'https://auth.example.com/revoke'
        try:
            response = requests.post(revoke_endpoint, data={'token': token})
            response.raise_for_status()
        except requests.RequestException as e:
            # Optionally log the error
            print(f"Token revocation failed: {e}")


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
