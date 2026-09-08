import logging
from importlib import import_module

from django.conf import settings

logger = logging.getLogger(__name__)
INTEGRATION_APPS = [s["integration"] for s in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if "integration" in s]


def get_integrations(request):
    app_integrations = []

    for app in INTEGRATION_APPS:
        try:
            mod = import_module(f"{app}.integrations")
            app_integrations += mod.provide_integrations(request)

        except Exception as exc:
            logger.warning(f"Call to module.provide_integrations fail for module: {app}. {str(exc)}")

    return app_integrations
