from django.conf import settings
from portal.apps.googledrive_integration.models import GoogleDriveUserToken


def provide_integrations(request):
    activated = False
    error = False
    error_message = 'Hello error message'

    try:
        request.user.googledrive_user_token
        activated = True
    except GoogleDriveUserToken.DoesNotExist:
        if 'googledrive_error' in request.session:
            error_message = request.session.pop('googledrive_error')
        pass

    integration = {
        'label': 'Google Drive',
        'description': 'Access files from your Google Drive account in {}.'.format(settings.PORTAL_NAMESPACE),
        'activated': activated,
        'error_message': error_message
    },

    return integration
