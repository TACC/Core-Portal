from django.apps import AppConfig


class SignalsConfig(AppConfig):
    name = 'portal.apps.signals'
    verbose_name = 'Portal Signals'

    def ready(self):
        import portal.apps.signals.receivers
        import portal.apps.signals.signals
