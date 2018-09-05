from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q
from django.conf import settings


class SharedSearchManager(BaseSearchManager):

    def __init__(self, request=None, **kwargs):
        if request:
            self._username = request.user.username
            self._query_string = request.GET.get('queryString')
        else:
            self._username = kwargs.get(
                'username', settings.PORTAL_ADMIN_USERNAME)
            self._query_string = kwargs.get('query_string')

        self._system = settings.AGAVE_COMMUNITY_DATA_SYSTEM

        super(SharedSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())

    def search(self, offset, limit):
        # Run search and return results as BaseESFile objects.
        # self.filter(Q({'term': {'pems.username': self._username }}))
        self.filter(Q({'term': {'system._exact': self._system}}))

        self.query("query_string", query=self._query_string,
                   fields=["name"], minimum_should_match="80%")

        self.extra(from_=offset, size=limit)
        return self._search

    def listing(self, ac):
        return self._listing(ac, self._system)
