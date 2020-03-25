

from django.apps import AppConfig
from django.conf import settings


class SearchConfig(AppConfig):
    name = 'portal.apps.search'

    def ready(self):
        from elasticsearch_dsl.connections import connections
        from django.conf import settings

        HOSTS = settings.ES_HOSTS

        connections.create_connection('default',
                                      hosts=HOSTS,
                                      http_auth=settings.ES_AUTH,
                                      max_retries=3,
                                      retry_on_timeout=True,
                                      )
