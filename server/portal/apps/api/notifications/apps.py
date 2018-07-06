from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    name = 'portal.apps.api.notifications'
    label = 'notifications_api'
    verbose_name = 'CEP Notifications'

    def ready(self):
        from portal.apps.api.notifications.receivers import (send_notification_ws,
                                                                 send_broadcast_ws)
