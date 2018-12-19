"""
.. module: portal.apps.search.api.managers.cms_search
   :synopsis: Manager handling CMS searches.
"""

from __future__ import unicode_literals, absolute_import
import logging
from future.utils import python_2_unicode_compatible
from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q, Index
from django.conf import settings

@python_2_unicode_compatible
class CMSSearchManager(BaseSearchManager):
    """ Search manager handling CMS data.
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
            self._query_string = kwargs.get('queryString')

        cms_index = Index('cms')

        self.sortFields = {
            'link': 'title_exact',
            'date': 'date'
        }

        super(CMSSearchManager, self).__init__(cms_index, cms_index.search())

    def search(self, offset, limit):
        """runs a search and returns an ES search object."""

        self.query(
            "query_string",
            query=self._query_string,
            default_operator="and",
            fields=['title', 'body'])
        self.extra(from_=offset, size=limit)
        self._search = self._search.highlight(
            'body',
            fragment_size=100).highlight_options(
            pre_tags=["<b>"],
            post_tags=["</b>"],
            require_field_match=False)

        sort_arg = self.sortFields.get(self._sortKey, None)
        if sort_arg:
            self.sort({sort_arg: {'order': self._sortOrder}})

        return self._search
