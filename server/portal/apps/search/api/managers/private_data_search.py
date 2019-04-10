"""
.. module: portal.apps.search.api.managers.private_data_search
   :synopsis: Manager handling My Data searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q
from django.conf import settings

logger = logging.getLogger(__name__)


class PrivateDataSearchManager(BaseSearchManager):
    """ Search manager handling My Data.
    """

    def __init__(self, request=None, **kwargs):
        if request:
            self._username = request.user.username
            self._query_string = request.GET.get('queryString')
            self._sort_key = request.GET.get('sortKey')
            self._sort_order = request.GET.get('sortOrder')
            self._system = request.GET.get('system')

            if self._system is None:
                self._system = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(
                self._username)
        else:
            self._username = kwargs.get(
                'username', settings.PORTAL_ADMIN_USERNAME)
            self.query_string = kwargs.get('query_string')
            self._system = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(
                self._username)

        self.sortFields = {
            'name': 'name._exact',
            'date_created': 'lastUpdated',
            'size': 'length',
            'last_modified': 'lastModified'
        }
        super(PrivateDataSearchManager, self).__init__(
            IndexedFile, IndexedFile.search())

    def search(self, offset, limit):
        """runs a search and returns an ES search object."""
            
        self.query("query_string", query=self._query_string,
                   fields=["name", "name._exact", "name._pattern"], 
                   analyzer='file_query_analyzer',
                   default_operator='and')
        self.filter(Q({'term': {'system._exact': self._system}}))
        sort_arg = self.sortFields.get(self._sort_key, None)
        if sort_arg:
            self.sort({sort_arg: {'order': self._sort_order}})
        self.extra(from_=offset, size=limit)
        # search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        return self._search

    def listing(self, ac):
        """Wraps the search result in a BaseFile object for serializtion."""
        
        return self._listing(ac, self._system)
