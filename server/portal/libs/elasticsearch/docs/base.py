"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""
import logging
import copy
import json
import os
import datetime
from django.conf import settings
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Search, Document, Date, Nested,
                               analyzer, Object, Text, Long,
                               Boolean, Keyword)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from portal.libs.elasticsearch import utils as ESUtils
from portal.libs.elasticsearch.exceptions import DocumentNotFound
from portal.libs.elasticsearch.analyzers import path_analyzer, file_analyzer, file_pattern_analyzer, reverse_file_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

try:
    HOSTS = settings.ES_HOSTS
    connections.configure(
        default={'hosts': HOSTS, 'http_auth': settings.ES_AUTH}
    )
except AttributeError as exc:
    logger.error('Missing ElasticSearch config. %s', exc)
    raise


class IndexedProject(Document):
    title = Text(fields={'_exact': Keyword()})
    description = Text()
    created = Date()
    lastModified = Date()
    projectId = Keyword()
    owner = Object(
        properties={
            'username': Keyword(),
            'fullName': Text()
        }
    )
    pi = Object(
        properties={
            'username': Keyword(),
            'fullName': Text()
        }
    )
    coPIs = Object(
        multi=True,
        properties={
            'username': Keyword(),
            'fullName': Text()
        }
    )
    teamMembers = Object(
        multi=True,
        properties={
            'username': Keyword(),
            'fullName': Text()
        }
    )

    @classmethod
    def from_id(cls, projectId):
        search = cls.search()
        search = search.query('term', **{'projectId': projectId})
        try:
            res = search.execute()
        except TransportError as exc:
            if exc.status_code == 404:
                raise
            res = search.execute()
        if res.hits.total.value > 1:
            for doc in res[1:int(res.hits.total.value)]:
                cls.get(doc.meta.id).delete()
            return cls.get(res[0].meta.id)
        elif res.hits.total.value == 1:
            return cls.get(res[0].meta.id)
        else:
            raise DocumentNotFound("No document found for project ID {}.".format(projectId))

    class Index:
        name = settings.ES_INDEX_PREFIX.format('projects')


class IndexedFile(Document):
    name = Text(analyzer=file_analyzer, fields={
        '_exact': Keyword(),
        '_pattern': Text(analyzer=file_pattern_analyzer),
        '_reverse': Text(analyzer=reverse_file_analyzer)})
    path = Text(fields={
        '_comps': Text(analyzer=path_analyzer),
        '_exact': Keyword(),
        '_reverse': Text(analyzer=reverse_file_analyzer)},
        )
    lastModified = Date()
    length = Long()
    format = Text()
    mimeType = Keyword()
    type = Text()
    system = Text(fields={'_exact': Keyword()})
    basePath = Text(
        fields={
            '_comps': Text(analyzer=path_analyzer),
            '_exact': Keyword()})
    lastUpdated = Date()
    pems = Object(properties={
        'username': Keyword(),
        'recursive': Boolean(),
        'permission': Object(properties={
            'read': Boolean(),
            'write': Boolean(),
            'execute': Boolean()
        })
    })

    def save(self, **kwargs):
        self.lastUpdated = datetime.datetime.now()
        return super(IndexedFile, self).save(**kwargs)

    @classmethod
    def from_path(cls, system, path):
        search = cls.search()
        search = search.filter('term', **{'path._exact': path})
        search = search.filter('term', **{'system._exact': system})
        try:
            res = search.execute()
        except TransportError as exc:
            if exc.status_code == 404:
                raise
        if res.hits.total.value > 1:
            for doc in res[1:res.hits.total.value]:
                cls.get(doc.meta.id).delete()
            return cls.get(res[0].meta.id)
        elif res.hits.total.value == 1:
            return cls.get(res[0].meta.id)
        else:
            raise DocumentNotFound("No document found for "
                                   "{}/{}".format(system, path))

    @classmethod
    def children(cls, system, path, limit=100, search_after=None):
        search = cls.search()
        search = search.filter('term', **{'basePath._exact': path})
        search = search.filter('term', **{'system._exact': system})
        search = search.sort('_id')
        search = search.extra(size=limit)
        if search_after:
            search = search.extra(search_after=search_after)

        res = search.execute()

        if len(res.hits) > 0:
            wrapped_children = [cls.get(doc.meta.id) for doc in res]
            sort_key = res.hits.hits[-1]['sort']
            return wrapped_children, sort_key
        else:
            return [], None

    class Index:
        name = settings.ES_INDEX_PREFIX.format('files')


class ReindexedFile(IndexedFile):
    class Index:
        name = settings.ES_INDEX_PREFIX.format('files-reindex')


class BaseESResource(object):
    """Base class used to represent an Elastic Search resource.

    This class implements basic wrapping functionality.
    .. note::

        Params stored in ``_wrapped`` are made available as attributes
        of the class.
    """
    def __init__(self, wrapped_doc=None, **kwargs):
        self._wrap(wrapped_doc, **kwargs)

    def to_dict(self):
        """Return wrapped doc as dict"""
        return self._wrapped.to_dict()

    def _wrap(self, wrapped_doc, **kwargs):
        if wrapped_doc and kwargs:
            wrapped_doc.update(**kwargs)
        object.__setattr__(self, '_wrapped', wrapped_doc)

    def _update(self, **kwargs):
        self._wrapped.update(**kwargs)

    def __getattr__(self, name):
        """Custom attribute getter
        """
        _wrapped = object.__getattribute__(self, '_wrapped')
        if _wrapped and hasattr(_wrapped, name):
            return getattr(_wrapped, name)

    def __setattr__(self, name, value):
        _wrapped = object.__getattribute__(self, '_wrapped')
        if _wrapped and hasattr(_wrapped, name):
            object.__setattr__(self._wrapped, name, value)
            return
        else:
            object.__setattr__(self, name, value)
            return