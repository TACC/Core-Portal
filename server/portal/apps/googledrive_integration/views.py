import google_auth_oauthlib.flow
import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.views.generic.base import TemplateView
from portal.apps.googledrive_integration.models import GoogleDriveUserToken

import logging
logger = logging.getLogger(__name__)


class IndexView(TemplateView):
    """
    Main workbench view.
    """
    template_name = 'portal/apps/workbench/index.html'

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
        scopes=['https://www.googleapis.com/auth/drive'])
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
    state = request.GET.get('state')
    if 'googledrivers' in request.session:
        googledrive = request.session['googledriveer']
    else:
        logger.error("Error getting googledrive state")
        request.session['googledrive_error'] = \
                    'Oh no! An unexpected error occurred while trying to set up the Google Drive application. Please try again.'
        # messages.error(request, 'Oh no! An unexpected error occurred while trying to set '
        #                         'up the Google Drive application. Please try again.')
        return HttpResponseRedirect('/accounts/profile')

    if not (state == googledrive['state']):
        logger.info("(state == googledrive['state']):  **********************************************")
        request.session['googledrive_error'] = \
                    'Oh no! An unexpected error occurred while trying to set up the Google Drive application. Please try again.'
        return HttpResponseRedirect('/accounts/profile')

    try:
        redirect_uri = reverse('googledrive_integration:oauth2_callback')
        flow = google_auth_oauthlib.flow.Flow.from_client_config(
            get_client_config(),
            scopes=['https://www.googleapis.com/auth/drive', ],
            state=state)
        flow.redirect_uri = 'https://{}{}'.format(request.get_host(), redirect_uri)

        # Use the authorization server's response to fetch the OAuth 2.0 tokens.
        authorization_response = 'https://{}{}'.format(request.get_host(), request.get_full_path())

        flow.fetch_token(authorization_response=authorization_response)

        credentials = flow.credentials
        if not credentials.refresh_token:
            # Auth flow completed previously, and no refresh_token granted. Need to disconnect to get
            # another refresh_token.

            logger.debug('GoogleDriveUserToken refresh_token cannot be null, revoking previous access and restart flow.')
            requests.post('https://accounts.google.com/o/oauth2/revoke',
                          params={'token': credentials.token},
                          headers={'content-type': 'application/x-www-form-urlencoded'})
            HttpResponseRedirect(reverse('googledrive_integration:initialize_token'))

        token = GoogleDriveUserToken(
            user=request.user,
            credentials=credentials)

        token.save()

    except Exception as e:
        logger.exception('Unable to complete Google Drive integration setup: %s' % e)
        request.session['googledrive_error'] = \
                    'Oh no! An unexpected error occurred while trying to set up the Google Drive application. Please try again.'

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
