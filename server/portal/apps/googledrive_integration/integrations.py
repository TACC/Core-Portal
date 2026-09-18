from django.conf import settings
from django.core.cache import cache
from django.urls import reverse

from portal.apps.googledrive_integration.models import GoogleDriveUserToken


def provide_integrations(request):
    activated = False
    error = ""

    try:
        request.user.googledrive_user_token
        activated = True
    except GoogleDriveUserToken.DoesNotExist:
        if cache.get(f"{request.session.session_key}_googledrive_error", False):
            error = cache.get(f"{request.session.session_key}_googledrive_error")
        pass

    integration = (
        {
            "label": "Google Drive",
            "description": f"Access files from your Google Drive account in {settings.PORTAL_NAMESPACE}.",
            "activated": activated,
            "error": error,
            "disconnect": reverse("googledrive_integration:disconnect"),
            "connect": reverse("googledrive_integration:initialize"),
        },
    )

    return integration
