# from the Channels docs:
# > Please note that URLRouter nesting will not work properly with path()
# > routes if inner routers are wrapped by additional middleware. See Issue #1428.
# > https://github.com/django/channels/issues/1428
from django.urls import re_path

from portal.apps.notifications.consumers import NotificationsConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/*$", NotificationsConsumer.as_asgi()),
]
