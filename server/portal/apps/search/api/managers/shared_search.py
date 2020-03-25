"""
.. module: portal.apps.search.api.managers.shared_search
   :synopsis: Manager handling Shared data searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from future.utils import python_2_unicode_compatible
from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q, Index
from django.conf import settings

@python_2_unicode_compatible
class SharedSearchManager(BaseSearchManager):
    """ Search manager handling shared data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self._username = request.user.username
            self._query_string = request.GET.get('queryString')
            self._sortKey = request.GET.get('sortKey')
            self._sortOrder = request.GET.get('sortOrder')
        else:
            self._username = kwargs.get(
                'username', settings.PORTAL_ADMIN_USERNAME)
            self._query_string = kwargs.get('query_string')

        self._system = settings.AGAVE_COMMUNITY_DATA_SYSTEM

        self.sortFields = {
            'name': 'name._exact',
            'date_created': 'lastUpdated',
            'size': 'length',
            'last_modified': 'lastModified'
        }

        super(SharedSearchManager, self).__init__(
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
        """Wraps the search result in a BaseFile object for serializtion."""

        return self._listing(ac, self._system)
