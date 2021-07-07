from django.conf import settings
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from django.core.cache import cache

def provide_integrations(request):
    activated = False
    error = False
    error_message = ''

    try:
        request.user.googledrive_user_token
        activated = True
    except GoogleDriveUserToken.DoesNotExist:
        if cache.get('{0}_googledrive_error'.format(request.session.session_key), False):
            error_message = cache.get('{0}_googledrive_error'.format(request.session.session_key))
        pass

    integration = {
        'label': 'Google Drive',
        'description': 'Access files from your Google Drive account in {}.'.format(settings.PORTAL_NAMESPACE),
        'activated': activated,
        'error_message': error_message
    },

    return integration
