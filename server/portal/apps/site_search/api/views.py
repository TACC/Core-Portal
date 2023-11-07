from django.http import JsonResponse
from elasticsearch_dsl import Search
from portal.libs.agave.operations import search as search_operation
from portal.views.base import BaseApiView
from django.conf import settings
from portal.libs.agave.utils import service_account
import logging
logger = logging.getLogger(__name__)


def cms_search(query_string, offset=0, limit=10):
    cms_index = settings.ES_INDEX_PREFIX.format('cms')
    cms_search = Search(index=cms_index)\
        .query(
        "query_string",
        query=query_string,
        default_operator="and",
        fields=['title', 'body'])\
        .highlight(
        'body',
        fragment_size=100)\
        .highlight('title')\
        .highlight_options(
        pre_tags=["<b>"],
        post_tags=["</b>"],
        require_field_match=False)\
        .extra(from_=offset, size=limit)

    cms_search = cms_search.execute()
    res = cms_search.hits
    total = cms_search.hits.total.value

    results = list(map(lambda x: {**x.to_dict(),
                                  'highlight': x.meta.highlight.to_dict()},
                       res))
    return total, results


def files_search(client, query_string, system, path, filter=None, offset=0, limit=10):
    res = search_operation(client, system, path, offset=offset, limit=limit,
                           query_string=query_string, filter=filter)
    return (res['count'], res['listing'])


class SiteSearchApiView(BaseApiView):

    def get(self, request, *args, **kwargs):
        qs = request.GET.get('query_string', '')
        filter = request.GET.get('filter', None)
        page = request.GET.get('page', 1)
        limit = 10
        offset = (int(page) - 1) * limit
        cms_total, cms_results = cms_search(qs, offset, limit)

        response = {
            'cms': {'count': cms_total,
                    'listing': cms_results,
                    'type': 'cms',
                    'include': True}}

        try:
            public_conf = next(conf for conf
                               in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
                               if conf['scheme'] == 'public'
                               and ('siteSearchPriority' in conf and conf['siteSearchPriority'] is not None))
            client = request.user.tapis_oauth.client if (request.user.is_authenticated and request.user.profile.setup_complete) else service_account()
            (public_total, public_results) = \
                files_search(client, qs, public_conf['system'], public_conf.get("homeDir", "/"), filter=filter,
                             offset=offset, limit=limit)
            response['public'] = {'count': public_total,
                                  'listing': public_results,
                                  'type': 'file',
                                  'include': True}
        except StopIteration:
            pass

        if request.user.is_authenticated and \
                request.user.profile.setup_complete:
            try:
                community_conf = \
                    next(conf for conf
                         in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
                         if conf['scheme'] == 'community'
                         and ('siteSearchPriority' in conf and conf['siteSearchPriority'] is not None))
                client = request.user.tapis_oauth.client
                (community_total, community_results) = \
                    files_search(client, qs, community_conf['system'], community_conf.get("homeDir", "/"), filter=filter,
                                 offset=offset,
                                 limit=limit)
                response['community'] = {'count': community_total,
                                         'listing': community_results,
                                         'type': 'file',
                                         'include': True}
            except StopIteration:
                pass

        return JsonResponse(response)
