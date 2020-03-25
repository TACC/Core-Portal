"""
.. module: portal.apps.search.api.managers.public_search
   :synopsis: Manager handling Public data searches.
"""


import logging
from future.utils import python_2_unicode_compatible
from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q, Index
from django.conf import settings

@python_2_unicode_compatible
class PublicSearchManager(BaseSearchManager):
    """ Search manager handling shared data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self._query_string = request.GET.get('queryString')
            self._sortKey = request.GET.get('sortKey', None)
            self._sortOrder = request.GET.get('sortOrder', None)
        else:
            self._query_string = kwargs.get('query_string')
            self._sortKey = kwargs.get('sortKey', None)
            self._sortOrder = kwargs.get('sortOrder', None)

        self._system = settings.AGAVE_PUBLIC_DATA_SYSTEM

        self.sortFields = {
            'name': 'name._exact',
            'date_created': 'lastUpdated',
            'size': 'length',
            'last_modified': 'lastModified'
        }

        super(PublicSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())

    def search(self, offset, limit):
        """runs a search and returns an ES search object."""

        ngram_query = Q("query_string", query=self._query_string,
                        fields=["name"],
                        minimum_should_match='80%',
                        default_operator='or')
        match_query = Q("query_string", query=self._query_string,
                        fields=[
                            "name._exact, name._pattern"],
                        default_operator='and')

        self.filter(Q({'term': {'system._exact': self._system}}))
        self.query(ngram_query | match_query)

        self.extra(from_=offset, size=limit)

        sort_arg = self.sortFields.get(self._sortKey, None)
        if sort_arg:
            self.sort({sort_arg: {'order': self._sortOrder}})

        return self._search

    def listing(self, ac):
        """Wraps the search result in a BaseFile object for serialization."""

        return self._listing(ac, self._system)
