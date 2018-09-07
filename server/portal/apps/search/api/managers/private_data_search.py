import logging
from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q
from django.conf import settings

logger = logging.getLogger(__name__)

class PrivateDataSearchManager(BaseSearchManager):

    def __init__(self, request=None, **kwargs):
        if request:
            self._username = request.user.username
            self._query_string = request.GET.get('queryString')
        else:
            self._username = kwargs.get(
                'username', settings.PORTAL_ADMIN_USERNAME)
            self.query_string = kwargs.get('query_string')

        self._system = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(self._username)
        super(PrivateDataSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())
 
    def search(self, offset, limit):
        # Run search and return results as BaseESFile objects.
        self.filter(Q({'term': {'pems.username': self._username}}))
        self.query("query_string", query=self._query_string,
                   fields=["name"], minimum_should_match="80%")
        self.filter(Q({'term': {'system._exact': self._system}}))
        self.extra(from_=offset, size=limit)
        # search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        return self._search

    def listing(self, ac):
        return self._listing(ac, self._system)
