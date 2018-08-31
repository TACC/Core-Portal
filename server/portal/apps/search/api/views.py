"""
.. :module:: apps.search.api.views
   :synopsys: Views to handle Search API
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.conf import settings
from portal.views.base import BaseApiView
from elasticsearch import TransportError
from elasticsearch_dsl import Q, Search
from elasticsearch import ConnectionTimeout
from operator import ior
from portal.libs.elasticsearch.docs.base import IndexedFile

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name

class SearchController(object):

    @staticmethod
    def execute_search(request, type_filter, q, offset, limit):
        if type_filter == 'public_files':
            return None
            es_query = SearchController.search_public_files(q, offset, limit)
        elif type_filter == 'published':
            return None
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
        out['public_files_total'] = 0 # SearchController.search_public_files(q, offset, limit).count()
        out['published_total'] = 0 # SearchController.search_published(q, offset, limit).count()
        out['cms_total'] = SearchController.search_cms_content(q, offset, limit).count()
        out['private_files_total'] = SearchController.search_my_data(request.user.username, q, offset, limit).count()
        out['filter'] = type_filter

        type_filter_options = ['public_files', 'published', 'cms', 'private_files']
        hits_total_array = [out['public_files_total'], out['published_total'], out['cms_total'], out['private_files_total']]

        out['total_hits_cumulative'] = sum(hits_total_array)

        # If there are hits not in the current type filter, set the 'filter' output to the filter with the most hits.
        if out['total_hits'] == 0 and out['total_hits_cumulative'] > 0:
            max_hits_total = max(hits_total_array)
            new_filter = [filter for i, filter in enumerate(type_filter_options) if hits_total_array[i] == max_hits_total][0]
            out['filter'] = new_filter

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
        systems = [settings.ES_PUBLIC_INDEX]
        system_queries = [Q('term', system=system) for system in systems]
        filters = reduce(ior, system_queries)

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

        search = Search(index=settings.ES_PUBLICATIONS_INDEX)\
            .query(query)\
            .extra(from_=offset, size=limit)
        return search

    @staticmethod
    def search_my_data(username, q, offset, limit):
        system = '.'.join([
            settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX, username])
        search = IndexedFile.search()
        search = search.filter(Q({'term': {'pems.username': username }}))
        search = search.query("query_string", query=q, fields=["name", "name._exact", "keywords"])
        search = search.filter(Q( {'term': {'system._exact': system} } ))
        search = search.extra(from_=offset, size=limit)
        # search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        return search

@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
class SearchApiView(BaseApiView):
    """ Projects listing view"""
    def get(self, request):
        q = request.GET.get('q', '')
        offset = request.GET.get('offset', 0)
        limit = request.GET.get('limit', 100)
        type_filter = request.GET.get('type_filter', 'cms')

        out = SearchController.execute_search(self.request, type_filter, q, offset, limit)

        return JsonResponse({'response': out})
