

from django.apps import AppConfig


class WebhookConfig(AppConfig):
    name = 'portal.apps.webhooks'
    label = 'webhooks'
    verbose_name = 'Portal Webhooks'
    app_label = 'webhooks'
