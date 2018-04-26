"""
.. :module:: apps.search.api.views
   :synopsys: Views to handle Search API
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.conf import settings
from portal.views.base import BaseApiView
import random
from elasticsearch_dsl import Q, Search
from elasticsearch_dsl.connections import connections
from elasticsearch import TransportError, ConnectionTimeout

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name

class SearchController(object):

    @staticmethod
    def execute_search(request, type_filter, q, offset, limit):
        if type_filter == 'public_files':
            es_query = SearchController.search_public_files(q, offset, limit)
        elif type_filter == 'published':
            es_query = SearchController.search_published(q, offset, limit)
        elif type_filter == 'cms':
            es_query = SearchController.search_cms_content(q, offset, limit)
        elif type_filter == 'private_files':
            es_query = SearchController.search_my_data(request.user.username, q, offset, limit)

        try:
            res = es_query.execute()
        except (TransportError, ConnectionTimeout) as err:
            if getattr(err, 'status_code', 500) == 404:
                raise
            res = es_query.execute()

        out = {}
        hits = []
        results = [r for r in res]

        if (type_filter != 'publications'):
            for r in results:
                d = r.to_dict()
                d["doc_type"] = r.meta.doc_type
                if hasattr(r.meta, 'highlight'):
                    highlight = r.meta.highlight.to_dict()
                    d["highlight"] = highlight
                hits.append(d)

        out['total_hits'] = res.hits.total
        out['hits'] = hits
        out['public_files_total'] = SearchController.search_public_files(q, offset, limit).count()
        out['published_total'] = SearchController.search_published(q, offset, limit).count()
        out['cms_total'] = SearchController.search_cms_content(q, offset, limit).count()
        out['private_files_total'] = SearchController.search_my_data(request.user.username, q, offset, limit).count()

        return out

    @staticmethod
    def search_cms_content(q, offset, limit):
        """search cms content """

        search = Search(index=settings.ES_CMS_INDEX).query(
            "query_string",
            query=q,
            default_operator="and",
            fields=['title', 'body']).extra(
                from_=offset,
                size=limit).highlight(
                    'body',
                    fragment_size=100).highlight_options(
                    pre_tags=["<b>"],
                    post_tags=["</b>"],
                    require_field_match=False)
        return search

    @staticmethod
    def search_public_files(q, offset, limit):
        """search public files"""

        filters = Q('term', system="nees.public") | \
                  Q('term', system="designsafe.storage.published") | \
                  Q('term', system="designsafe.storage.community")
        search = Search(index=settings.ES_DEFAULT_INDEX)\
            .query("query_string", query="*"+q+"*", default_operator="and")\
            .filter(filters)\
            .filter("term", type="file")\
            .extra(from_=offset, size=limit)
        logger.info(search.to_dict())
        return search

    @staticmethod
    def search_published(q, offset, limit):
        """ search published content """

        query = Q('bool', must=[Q('simple_query_string', query=q)])

        search = Search(index="des-publications_legacy,des-publications")\
            .query(query)\
            .extra(from_=offset, size=limit)
        return search

    @staticmethod
    def search_my_data(username, q, offset, limit):
        search = Search(index=settings.ES_DEFAULT_INDEX)
        search = search.filter("nested", path="permissions", query=Q("term", permissions__username=username))
        search = search.query("simple_query_string", query=q, fields=["name", "name._exact", "keywords"])
        search = search.query(Q('bool', must=[Q({'prefix': {'path._exact': username}})]))
        search = search.filter("term", system='designsafe.storage.default')
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        logger.info(search.to_dict())
        return search


class SearchApiView(BaseApiView):
    """ Projects listing view"""
    def get(self, request):
        logger.debug(request.GET.get('q'))
        q = request.GET.get('q')
        offset = request.GET.get('offset')
        limit = request.GET.get('limit')
        type_filter = request.GET.get('type_filter')
        logger.debug(type_filter)

        out = SearchController.execute_search(self.request, type_filter, q, offset, limit)

        return JsonResponse({'response': out})
