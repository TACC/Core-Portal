# chat/routing.py
from django.urls import re_path

from portal.apps.notifications.consumers import NotificationsConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', NotificationsConsumer),
]
