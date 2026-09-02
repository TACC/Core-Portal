"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import portal.apps.notifications.routing


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portal.settings.settings')
django.setup()
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            portal.apps.notifications.routing.websocket_urlpatterns
        )
    )
})
