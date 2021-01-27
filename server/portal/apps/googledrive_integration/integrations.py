from django.conf import settings
from portal.apps.googledrive_integration.models import GoogleDriveUserToken


def provide_integrations(user):
    activated = False
    try:
        user.googledrive_user_token
        activated = True
    except GoogleDriveUserToken.DoesNotExist:
        pass

    integration = {
        'label': 'Google Drive',
        'description': 'Access files from your Google Drive account in {}.'.format(settings.PORTAL_NAMESPACE),
        'activated': activated
    },

    return integration
