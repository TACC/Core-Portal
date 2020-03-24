"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""
import logging
import datetime
from django.conf import settings
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Document, Date, Object, Text, Long, Boolean,
                               Keyword)

from elasticsearch import TransportError
from portal.libs.elasticsearch.exceptions import DocumentNotFound
from portal.libs.elasticsearch.analyzers import path_analyzer, file_analyzer, file_pattern_analyzer, reverse_file_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


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

    def update(self, **kwargs):
        lastUpdated = datetime.datetime.now()
        return super(IndexedFile, self).update(lastUpdated=lastUpdated, **kwargs)

    @classmethod
    def from_path(cls, system, path):
        search = cls.search()
        search = search.filter('term', **{'path._exact': path})
        search = search.filter('term', **{'system._exact': system})
        search_scan = search.scan()
        try:
            result = next(search_scan)
        except StopIteration:
            raise DocumentNotFound("No document found for "
                                   "{}/{}".format(system, path))
        # Iterate through any duplicate results and delete them if they exist.
        for duplicate in search_scan:
            cls.get(duplicate.meta.id).delete()
        return cls.get(result.meta.id)

    @classmethod
    def list_children(cls, system, path):
        return cls(system=system, path=path).children()

    def children(self):
        search = self.search()
        search = search.filter('term', **{'basePath._exact': self.path})
        search = search.filter('term', **{'system._exact': self.system})

        for hit in search.scan():
            yield self.get(hit.meta.id)

    def delete_recursive(self):
        for child in self.children():
            child.delete_recursive()
        self.delete()

    class Index:
        name = settings.ES_INDEX_PREFIX.format('files')


class ReindexedFile(IndexedFile):
    class Index:
        name = settings.ES_INDEX_PREFIX.format('files-reindex')
