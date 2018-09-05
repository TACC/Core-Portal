from portal.apps.search.api.managers.base import BaseSearchManager
from portal.libs.elasticsearch.docs.base import IndexedFile
from elasticsearch_dsl import Q, Index
from django.conf import settings


class CMSSearchManager(BaseSearchManager):

    def __init__(self, request=None, **kwargs):
        if request:
            self._username = request.user.username
            self._query_string = request.GET.get('queryString')
        else:
            self._username = kwargs.get(
                'username', settings.PORTAL_ADMIN_USERNAME)
            self._query_string = kwargs.get('queryString')

        cms_index = Index('cms')
        super(CMSSearchManager, self).__init__(cms_index, cms_index.search())

    def search(self, offset, limit):
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

        return self._search
