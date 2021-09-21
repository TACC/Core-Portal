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
from portal.apps.auth.models import AgaveOAuthToken
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


# Create your views here.
def agave_oauth(request):
    """First step for agave OAuth workflow.
    """
    tenant_base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
    client_key = getattr(settings, 'AGAVE_CLIENT_KEY')

    session = request.session
    session['auth_state'] = _get_auth_state()
    next_page = request.GET.get('next')
    if next_page:
        session['next'] = next_page

    redirect_uri = 'https://{}{}'.format(request.get_host(),
                                         reverse('portal_auth:agave_oauth_callback'))
    logger.debug('redirect_uri %s', redirect_uri)
    METRICS.debug("user:{} starting oauth redirect login".format(request.user.username))
    authorization_url = (
        '%s/authorize?client_id=%s&response_type=code&redirect_uri=%s&state=%s' % (
            tenant_base_url,
            client_key,
            redirect_uri,
            session['auth_state'],
        )
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


def agave_oauth_callback(request):
    """Agave OAuth callback handler.
    """

    state = request.GET.get('state')

    if request.session['auth_state'] != state:
        msg = ('OAuth Authorization State mismatch!? auth_state=%s '
               'does not match returned state=%s' % (request.session['auth_state'], state))
        logger.warning(msg)
        return HttpResponseBadRequest('Authorization State Failed')

    if 'code' in request.GET:
        # obtain a token for the user
        # Using http for dev.
        # redirect_uri = 'http://{}{}'.format(request.get_host(),
        #                                    reverse('portal_auth:agave_oauth_callback'))
        # Use https for prod.
        redirect_uri = 'https://{}{}'.format(request.get_host(),
                                             reverse('portal_auth:agave_oauth_callback'))
        code = request.GET['code']
        tenant_base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')
        client_key = getattr(settings, 'AGAVE_CLIENT_KEY')
        client_sec = getattr(settings, 'AGAVE_CLIENT_SECRET')
        redirect_uri = redirect_uri
        body = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': redirect_uri,
        }
        # TODO update to token call in agavepy
        response = requests.post('%s/token' % tenant_base_url,
                                 data=body,
                                 auth=(client_key, client_sec))
        token_data = response.json()
        token_data['created'] = int(time.time())
        # log user in
        user = authenticate(backend='agave', token=token_data['access_token'])

        if user:
            try:
                token = user.agave_oauth
                token.update(**token_data)
            except ObjectDoesNotExist:
                token = AgaveOAuthToken(**token_data)
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
            logger.warning('Authorization failed: %s', error)

        return HttpResponseRedirect(reverse('portal_accounts:logout'))

    redirect = getattr(settings, 'LOGIN_REDIRECT_URL', '/')
    next = ''
    if 'next' in request.session:
        next = '?next=' + request.session.pop('next')

    response = HttpResponseRedirect(redirect + next)
    return response


def agave_session_error(request):
    """Agave token error handler.
    """
    pass
