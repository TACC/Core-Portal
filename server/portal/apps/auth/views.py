"""
Auth views.
"""
import logging
import time
import requests
import secrets
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.urls import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponseRedirect, HttpResponseBadRequest
from django.shortcuts import render
from .models import TapisOAuthToken
from portal.apps.onboarding.execute import (
    execute_setup_steps,
    new_user_setup_check
)
from portal.apps.search.tasks import index_allocations


logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


def logged_out(request):
    return render(request, 'portal/apps/auth/logged_out.html')


def _get_auth_state():
    return secrets.token_hex(24)


def tapis_oauth(request):
    """First step for Tapis OAuth workflow.
    """
    session = request.session
    session['auth_state'] = _get_auth_state()
    next_page = request.GET.get('next')
    if next_page:
        session['next'] = next_page

    if request.is_secure():
        protocol = 'https'
    else:
        protocol = 'http'

    redirect_uri = f"{protocol}://{request.get_host()}{reverse('portal_auth:tapis_oauth_callback')}"

    tenant_base_url = getattr(settings, 'TAPIS_TENANT_BASE_URL')
    client_id = getattr(settings, 'TAPIS_CLIENT_ID')

    METRICS.debug("user:{} starting oauth redirect login".format(request.user.username))
    # Authorization code request
    authorization_url = (
        f"{tenant_base_url}/v3/oauth2/authorize?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        "response_type=code&"
        f"state={session['auth_state']}"
    )

    return HttpResponseRedirect(authorization_url)


def launch_setup_checks(user):
    """Perform any onboarding checks or non-onboarding steps that may spawn celery tasks
    """

    # Check onboarding settings
    new_user_setup_check(user)
    if not user.profile.setup_complete:
        logger.info("Executing onboarding setup steps for %s", user.username)
        execute_setup_steps.apply_async(args=[user.username])
    else:
        logger.info("Already onboarded, running non-onboarding steps (e.g. update cached "
                    "allocation information) for %s", user.username)
        index_allocations.apply_async(args=[user.username])


def tapis_oauth_callback(request):
    """Tapis OAuth callback handler.
    """

    state = request.GET.get('state')

    if request.session['auth_state'] != state:
        msg = (
            'OAuth Authorization State mismatch!? auth_state=%s '
            'does not match returned state=%s' % (
                request.session['auth_state'], state
            )
        )
        logger.warning(msg)
        return HttpResponseBadRequest('Authorization State Failed')

    if 'code' in request.GET:
        # obtain a token for the user
        if request.is_secure():
            protocol = 'https'
        else:
            protocol = 'http'
        redirect_uri = f"{protocol}://{request.get_host()}{reverse('portal_auth:tapis_oauth_callback')}"
        code = request.GET['code']

        body = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        }
        response = requests.post(f"{settings.TAPIS_TENANT_BASE_URL}/v3/oauth2/tokens", data=body, auth=(settings.TAPIS_CLIENT_ID, settings.TAPIS_CLIENT_KEY))
        response_json = response.json()
        token_data = {
            'created': int(time.time()),
            'access_token': response_json['result']['access_token']['access_token'],
            'refresh_token': response_json['result']['refresh_token']['refresh_token'],
            'expires_in': response_json['result']['access_token']['expires_in']
        }

        # log user in
        user = authenticate(backend='tapis', token=token_data['access_token'])

        if user:
            try:
                token = user.tapis_oauth
                token.update(**token_data)
            except ObjectDoesNotExist:
                token = TapisOAuthToken(**token_data)
                token.user = user
            token.save()

            login(request, user)
            METRICS.debug("user:{} successful oauth login".format(user.username))
            launch_setup_checks(user)
        else:
            messages.error(
                request,
                'Authentication failed. Please try again. If this problem '
                'persists please submit a support ticket.'
            )
            return HttpResponseRedirect(reverse('portal_accounts:logout'))
    else:
        if 'error' in request.GET:
            error = request.GET['error']
            logger.warning('Authorization failed: %s' % error)

        return HttpResponseRedirect(reverse('portal_accounts:logout'))

    redirect = getattr(settings, 'LOGIN_REDIRECT_URL', '/')
    if 'next' in request.session:
        redirect += '?next=' + request.session.pop('next')

    response = HttpResponseRedirect(redirect)
    return response
