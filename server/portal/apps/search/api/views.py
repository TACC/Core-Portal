"""
.. :module:: apps.search.api.views
   :synopsys: Views to handle Search API
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from portal.views.base import BaseApiView
import random
from elasticsearch_dsl import Q, Search
from elasticsearch_dsl.connections import connections
from elasticsearch import TransportError, ConnectionTimeout

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name
#connections.configure(default={'hosts': ['designsafe-es01.tacc.utexas.edu']})

class SearchApiView(BaseApiView):
    """ Projects listing view"""
    def get(self, request):
        logger.debug(request.GET.get('q'))
        q = request.GET.get('q')
        offset = request.GET.get('offset')
        limit = request.GET.get('limit')
        type_filter = request.GET.get('type_filter')
        logger.debug(type_filter)


        if type_filter == 'public_files':
            es_query = self.search_public_files(q, offset, limit)
        elif type_filter == 'published':
            es_query = self.search_published(q, offset, limit)
        elif type_filter == 'cms':
            es_query = self.search_cms_content(q, offset, limit)
        elif type_filter == 'private_files':
            es_query = self.search_my_data(self.request.user.username, q, offset, limit)

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
        out['public_files_total'] = self.search_public_files(q, offset, limit).count()
        out['published_total'] = self.search_published(q, offset, limit).count()
        out['cms_total'] = self.search_cms_content(q, offset, limit).count()
        out['private_files_total'] = self.search_my_data(self.request.user.username, q, offset, limit).count()
        logger.debug("private_files_total: " + str(out['private_files_total']))
        # if request.user.is_authenticated:

        # s = Search(index="des-files").query("query_string", query="*"+q+"*", default_operator="and").extra(from_=offset, size=limit)
        # results =  [{"mimeType": "text/directory", "name": "ingest", "format": "folder", "lastModified": "2017-12-20T11:58:04-06:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/ingest", "system": "data-sd2e-community", "name": "ingest"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//ingest"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/ingest", "type": "dir", "permissions": "ALL"}, {"mimeType": "text/directory", "name": "ingest-dev", "format": "folder", "lastModified": "2017-11-10T16:05:48-06:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/ingest-dev", "system": "data-sd2e-community", "name": "ingest-dev"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//ingest-dev"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/ingest-dev", "type": "dir", "permissions": "ALL"}, {"mimeType": "application/octet-stream", "name": "manifest.json", "format": "raw", "lastModified": "2017-12-04T19:11:07-06:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/manifest.json", "system": "data-sd2e-community", "name": "manifest.json"}], "length": 3, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//manifest.json"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/manifest.json", "type": "file", "permissions": "READ_WRITE"}, {"mimeType": "text/directory", "name": "processed", "format": "folder", "lastModified": "2017-10-14T10:41:05-05:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/processed", "system": "data-sd2e-community", "name": "processed"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//processed"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/processed", "type": "dir", "permissions": "ALL"}, {"mimeType": "text/directory", "name": "processed_staging", "format": "folder", "lastModified": "2017-10-14T10:41:09-05:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/processed_staging", "system": "data-sd2e-community", "name": "processed_staging"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//processed_staging"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/processed_staging", "type": "dir", "permissions": "ALL"}, {"mimeType": "text/plain", "name": "README.txt", "format": "raw", "lastModified": "2017-10-14T10:29:16-05:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/README.txt", "system": "data-sd2e-community", "name": "README.txt"}], "length": 4669, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//README.txt"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/README.txt", "type": "file", "permissions": "READ_WRITE"}, {"mimeType": "text/directory", "name": "reference", "format": "folder", "lastModified": "2017-11-29T09:29:11-06:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/reference", "system": "data-sd2e-community", "name": "reference"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//reference"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/reference", "type": "dir", "permissions": "ALL"}, {"mimeType": "text/directory", "name": "sample", "format": "folder", "lastModified": "2017-12-14T09:47:31-06:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/sample", "system": "data-sd2e-community", "name": "sample"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//sample"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/sample", "type": "dir", "permissions": "ALL"}, {"mimeType": "text/directory", "name": "shared-q0-hackathon", "format": "folder", "lastModified": "2017-11-24T09:02:50-06:00", "system": "data-sd2e-community", "trail": [{"path": "", "system": "data-sd2e-community", "name": ""}, {"path": "/shared-q0-hackathon", "system": "data-sd2e-community", "name": "shared-q0-hackathon"}], "length": 4096, "_links": {"_self": {"href": "https://api.sd2e.org/files/v2/media/system/data-sd2e-community//shared-q0-hackathon"}, "system": {"href": "https://api.sd2e.org/systems/v2/data-sd2e-community"}}, "path": "/shared-q0-hackathon", "type": "dir", "permissions": "ALL"}]
        # s = self.search_public_files(q, offset, limit)
        results = [r.to_dict() for r in es_query.execute()]
        # logger.debug(results[0])
        return JsonResponse({'response': out})


    def search_cms_content(self, q, offset, limit):
        """search cms content """

        search = Search(index="cms").query(
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

    def search_public_files(self, q, offset, limit):
        """search public files"""

        filters = Q('term', system="nees.public") | \
                  Q('term', system="designsafe.storage.published") | \
                  Q('term', system="designsafe.storage.community")
        search = Search(index="des-files")\
            .query("query_string", query="*"+q+"*", default_operator="and")\
            .filter(filters)\
            .filter("term", type="file")\
            .extra(from_=offset, size=limit)
        logger.info(search.to_dict())
        return search


    def search_published(self, q, offset, limit):
        """ search published content """

        query = Q('bool', must=[Q('simple_query_string', query=q)])

        search = Search(index="des-publications_legacy,des-publications")\
            .query(query)\
            .extra(from_=offset, size=limit)
        return search

    def search_my_data(self, username, q, offset, limit):
        search = Search(index='des-files')
        search = search.filter("nested", path="permissions", query=Q("term", permissions__username=username))
        search = search.query("simple_query_string", query=q, fields=["name", "name._exact", "keywords"])
        search = search.query(Q('bool', must=[Q({'prefix': {'path._exact': username}})]))
        search = search.filter("term", system='designsafe.storage.default')
        search = search.query(Q('bool', must_not=[Q({'prefix': {'path._exact': '{}/.Trash'.format(username)}})]))
        logger.info(search.to_dict())
        return search
