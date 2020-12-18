from importlib import import_module
import logging


logger = logging.getLogger(__name__)
INTEGRATION_APPS = ['portal.apps.googledrive_integration']


def get_integrations(user):
    app_integrations = []

    for app in INTEGRATION_APPS:
        try:
            mod = import_module('{}.integrations'.format(app))
            app_integrations += mod.provide_integrations(user)

        except Exception as exc:
            logger.warning('Call to module.provide_integrations fail for module: {app_name}. {exc}'
                           .format(app_name=app, exc=str(exc)))

    return app_integrations
