"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os

import django
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "portal.settings.settings")
django.setup()
asgi_app = get_asgi_application()

# import routes/settings after app initialization
from django.conf import settings  # noqa
import portal.apps.notifications.routing  # noqa


if settings.DEBUG:
    asgi_app = ASGIStaticFilesHandler(asgi_app)

application = ProtocolTypeRouter(
    {
        "http": asgi_app,
        "websocket": AuthMiddlewareStack(URLRouter(portal.apps.notifications.routing.websocket_urlpatterns)),
    }
)
