import google_auth_oauthlib.flow
import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import TemplateView
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from django.core.cache import cache

import logging
logger = logging.getLogger(__name__)


class IndexView(TemplateView):
    """
    Main workbench view.
    """
    template_name = 'portal/apps/workbench/index.html'

    def get_context_data(self, **kwargs):
        context = super(IndexView, self).get_context_data(**kwargs)
        context['setup_complete'] = False if self.request.user.is_anonymous \
            else self.request.user.profile.setup_complete
        context['DEBUG'] = settings.DEBUG
        return context

    def dispatch(self, request, *args, **kwargs):
        return super(IndexView, self).dispatch(request, *args, **kwargs)


def get_client_config():
    if 'google-drive' not in settings.EXTERNAL_RESOURCE_SECRETS:
        raise Exception("Google Drive not configured")
    googledrive_secrets = settings.EXTERNAL_RESOURCE_SECRETS['google-drive']
    CLIENT_CONFIG = {'web': {
        "client_id": googledrive_secrets['client_id'],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://accounts.google.com/o/oauth2/token",
        "client_secret": googledrive_secrets['client_secret']
    }}
    return CLIENT_CONFIG


@csrf_exempt
@login_required
def initialize_token(request):
    redirect_uri = 'https://{}{}'.format(request.get_host(),
                                         reverse('googledrive_integration:oauth2_callback'))
    flow = google_auth_oauthlib.flow.Flow.from_client_config(
        get_client_config(),
        scopes=['https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive.appdata'])
    flow.redirect_uri = request.build_absolute_uri(redirect_uri)
    # flow.redirect_uri = 'https://cep.dev/accounts/applications/googledrive/oauth2/'
    auth_url, state = flow.authorization_url(access_type='offline')

    request.session['googledrive'] = {
        'state': state
    }
    return HttpResponseRedirect(auth_url)


@csrf_exempt
@login_required
def oauth2_callback(request):
    error = 'SETUP_ERROR'
    error_timeout = 5
    state = request.GET.get('state')
    if 'googledrive' in request.session:
        googledrive = request.session['googledrive']
    else:
        logger.error('Could not retrieve googledrive from session')
        cache.set('{0}_googledrive_error'.format(request.session.session_key), error, error_timeout)
        return HttpResponseRedirect('/accounts/profile')

    if not (state == googledrive['state']):
        logger.error('Could not retrieve state from googledrive stored var')
        cache.set('{0}_googledrive_error'.format(request.session.session_key), error, error_timeout)
        return HttpResponseRedirect('/accounts/profile')

    try:
        redirect_uri = reverse('googledrive_integration:oauth2_callback')
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            get_client_config(),
            scopes=['https://www.googleapis.com/auth/drive.file', 
                    'https://www.googleapis.com/auth/drive.appdata'],
            state=state)
        flow.redirect_uri = 'https://{}{}'.format(request.get_host(), redirect_uri)

        # Use the authorization server's response to fetch the OAuth 2.0 tokens.
        authorization_response = 'https://{}{}'.format(request.get_host(), request.get_full_path())

        flow.fetch_token(authorization_response=authorization_response)

        credentials = flow.credentials
        if not credentials.refresh_token:
            # Auth flow completed previously, and no refresh_token granted. Need to disconnect to get
            # another refresh_token.

            logger.error('GoogleDriveUserToken refresh_token cannot be null, revoking previous access and restart flow.')
            requests.post('https://accounts.google.com/o/oauth2/revoke',
                          params={'token': credentials.token},
                          headers={'content-type': 'application/x-www-form-urlencoded'})
            HttpResponseRedirect(reverse('googledrive_integration:initialize_token'))

        GoogleDriveUserToken.objects.update_or_create(
            user=request.user,
            defaults={'credentials': credentials})

    except Exception as e:
        logger.exception('Unable to complete Google Drive integration setup: %s' % e)
        cache.set('{0}_googledrive_error'.format(request.session.session_key), error, error_timeout)

    return HttpResponseRedirect('/accounts/profile')


@login_required
def disconnect(request):

    logger.info('Disconnect Google Drive requested by user...')
    try:
        googledrive_user_token = GoogleDriveUserToken.objects.get(user=request.user)

        revoke = requests.post('https://accounts.google.com/o/oauth2/revoke',
                               params={'token': googledrive_user_token.credentials.token},
                               headers={'content-type': 'application/x-www-form-urlencoded'})

        status_code = getattr(revoke, 'status_code')
        googledrive_user_token.delete()

        if status_code == 200:
            return HttpResponseRedirect('/accounts/profile')

        else:
            logger.error('Disconnect Google Drive; google drive account revoke error.',
                         extra={'user': request.user})
            logger.debug('status code:{}'.format(status_code))

            return HttpResponseRedirect('/accounts/profile')

    except GoogleDriveUserToken.DoesNotExist:
        logger.warn('Disconnect Google Drive; GoogleDriveUserToken does not exist.',
                    extra={'user': request.user})

    except Exception as e:
        logger.error('Disconnect Google Drive; GoogleDriveUserToken delete error.',
                     extra={'user': request.user})
        logger.exception('google drive delete error: {}'.format(e))

    return HttpResponseRedirect('/accounts/profile')
