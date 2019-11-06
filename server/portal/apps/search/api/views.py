"""
.. :module:: apps.search.api.views
   :synopsys: Views to handle Search API
"""

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

from portal.apps.search.api.lookups import search_lookup_manager
from portal.apps.search.api.managers.shared_search import SharedSearchManager
from portal.apps.search.api.managers.cms_search import CMSSearchManager
from portal.apps.search.api.managers.private_data_search import PrivateDataSearchManager

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


class SearchController(object):

    @staticmethod
    def execute_search(request, type_filter, q, offset, limit):

        lookup_keys = {
            'private_files': 'my-data',
            'public_files': 'shared',
            'cms': 'cms'
        }

        doc_type_map = {
            'private_files': 'files',
            'public_files': 'files',
            'cms': 'modelresult'
        }

        searchmgr_cls = search_lookup_manager(lookup_keys[type_filter])
        searchmgr = searchmgr_cls(request)
        cls_search = searchmgr.search(offset, limit)

        res = cls_search.execute()
        out = {}
        hits = []
        results = [r for r in res]

        if (type_filter != 'publications'):
            for r in results:
                d = r.to_dict()
                d["doc_type"] = doc_type_map[type_filter]
                if hasattr(r.meta, 'highlight'):
                    highlight = r.meta.highlight.to_dict()
                    d["highlight"] = highlight
                hits.append(d)

        out['total_hits'] = res.hits.total.value
        out['hits'] = hits
        out['public_files_total'] = SharedSearchManager(
            request).search(offset, limit).count()
        out['published_total'] = 0
        out['cms_total'] = CMSSearchManager(
            request).search(offset, limit).count()
        out['private_files_total'] = PrivateDataSearchManager(
            request).search(offset, limit).count()
        out['filter'] = type_filter

        type_filter_options = ['public_files',
                               'published',
                               'cms',
                               'private_files']

        hits_total_array = [out['public_files_total'],
                            out['published_total'],
                            out['cms_total'],
                            out['private_files_total']]

        out['total_hits_cumulative'] = sum(hits_total_array)

        # If there are hits not in the current type filter, set the 'filter' output to the filter with the most hits.
        if out['total_hits'] == 0 and out['total_hits_cumulative'] > 0:
            max_hits_total = max(hits_total_array)
            new_filter = [filter for i, filter in enumerate(
                type_filter_options) if hits_total_array[i] == max_hits_total][0]
            out['filter'] = new_filter

        return out

class SearchApiView(BaseApiView):
    """ Projects listing view"""

    def get(self, request):
        q = request.GET.get('queryString')
        offset = request.GET.get('offset')
        limit = request.GET.get('limit')
        type_filter = request.GET.get('typeFilter')

        out = SearchController.execute_search(
            self.request, type_filter, q, offset, limit)

        return JsonResponse({'response': out})
