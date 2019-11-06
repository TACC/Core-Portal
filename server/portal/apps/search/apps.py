

from django.apps import AppConfig
from django.conf import settings


class SearchConfig(AppConfig):
    name = 'portal.apps.search'

    def ready(self):
        from elasticsearch_dsl.connections import connections
        from django.conf import settings

        HOSTS = settings.ES_HOSTS

        connections.configure(default={"hosts": HOSTS, "http_auth": settings.ES_AUTH},
                              request_timeout=60,
                              sniff_on_start=True,
                              sniffer_timeout=60,
                              sniff_on_connection_fail=True,
                              sniff_timeout=10,
                              max_retries=3,
                              retry_on_timeout=True)

        