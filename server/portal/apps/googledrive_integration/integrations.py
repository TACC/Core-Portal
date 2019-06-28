from django.core.urlresolvers import reverse
from django.conf import settings
from portal.apps.data_depot.managers.google_drive import FileManager


def provide_integrations():
    integration = [
        {
            'label': 'Google Drive',
            'href': reverse('googledrive_integration:index'),
            'description': 'Access files from your Google Drive account in {}.'.format(settings.PORTAL_NAMESPACE),
        },
    ]

    return integration if FileManager.NAME in settings.EXTERNAL_RESOURCE_SECRETS else []
