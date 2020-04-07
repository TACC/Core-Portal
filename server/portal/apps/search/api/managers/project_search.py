"""
.. module: portal.apps.search.api.managers.shared_search
   :synopsis: Manager handling Shared data searches.
"""


import logging
from future.utils import python_2_unicode_compatible
from portal.apps.search.api.managers.base import BaseSearchManager
# from portal.libs.elasticsearch.docs.base import IndexedProject
from elasticsearch_dsl import Q, Index
from django.conf import settings


@python_2_unicode_compatible
class ProjectSearchManager(BaseSearchManager):
    """ Search manager handling shared data.
    """

    def __init__(self, username, query_string, **kwargs):
        self._username = username
        self._query_string = query_string

        super(ProjectSearchManager, self).__init__(
            IndexedProject, IndexedProject.search())

    def search(self, offset, limit):
        """runs a search and returns an ES search object."""
        owner_query = Q({'term': {'owner.username': self._username}})
        pi_query = Q({'term': {'pi.username': self._username}})
        team_query = Q({'term': {'teamMembers.username': self._username}}) 

        self.filter(owner_query | pi_query | team_query)

        self.query("query_string", query=self._query_string,
            minimum_should_match="80%")

        self.extra(from_=offset, size=limit)

        return self._search

    def list(self, mgr):
        """Wraps the search result in a BaseFile object for serializtion."""
        res = self._search.execute()
        return [mgr.get_by_project_id(hit.projectId).storage for hit in res]
