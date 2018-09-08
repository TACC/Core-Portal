"""
.. module: portal.libs.elasticsearch.docs.base
   :synopsis: Wrapper classes for ES different doc types.
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import copy
import json
import os
from datetime import datetime
from django.conf import settings
from elasticsearch_dsl.connections import connections
from elasticsearch_dsl import (Search, DocType, Date, Nested,
                               analyzer, Object, Text, Long,
                               InnerObjectWrapper, Boolean, Keyword)
from elasticsearch_dsl.query import Q
from elasticsearch import TransportError
from portal.libs.elasticsearch import utils as ESUtils
from portal.libs.elasticsearch.exceptions import DocumentNotFound
from portal.libs.elasticsearch.analyzers import path_analyzer, file_analyzer

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

try:
    DEFAULT_INDEX = settings.ES_DEFAULT_INDEX
    HOSTS = settings.ES_HOSTS
    FILES_DOC_TYPE = settings.ES_FILES_DOC_TYPE
    connections.configure(
        default={'hosts': HOSTS}
    )
except AttributeError as exc:
    logger.error('Missing ElasticSearch config. %s', exc)
    raise

@python_2_unicode_compatible
class IndexedFile(DocType):
    name = Text(analyzer=file_analyzer, fields={
        '_exact': Keyword()})
    path = Text(fields={
        '_comps': Text(analyzer=path_analyzer),
        '_exact': Keyword()})
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
        self.lastUpdated = datetime.now()
        return super(IndexedFile, self).save(**kwargs)

    @classmethod
    def from_path(cls, username, system, path):
        search = cls.search()
        search = search.query('term', **{'path._exact': path})
        search = search.filter(Q({'term': {'pems.username': username} }))
        search = search.filter('term', **{'system._exact': system})
        try:
            res = search.execute()
        except TransportError as exc:
            if exc.status_code == 404:
                raise
            res = search.execute()
        if res.hits.total > 1:
            for doc in search[1:res.hits.total]:
                doc.delete()
            return res[0]
        elif res.hits.total == 1:
            return res[0]
        else:
            raise DocumentNotFound("No document found for username={} "
                                   "{}/{}".format(username, system, path))

    @classmethod
    def children(cls, username, system, path):
        search = cls.search()
        search = search.query('term', **{'basePath._exact': path})
        search = search.filter(Q({'term': {'pems.username': username} }))
        search = search.filter('term', **{'system._exact': system})
        search = search.sort('path._exact')
        try:
            res = search.execute()
        except TransportError as exc:
            if exc.status_code == 404:
                raise
            res = search.execute()
        if res.hits.total:
            return (res, search)
        else:
            raise DocumentNotFound("No document found for username={} "
                                   "{}/{}".format(username, system, path))

    class Meta:
        index = DEFAULT_INDEX
        doc_type = FILES_DOC_TYPE

@python_2_unicode_compatible
class BaseESResource(object):
    """Base class used to represent an Elastic Search resource.

    This class implements basic wrapping functionality.
    """
    def __init__(self, username, wrapped_doc, **kwargs):
        """This class will allow easy access to a JSON object which has been
        converted into a dictionary.

        :param str username: username

        .. note::

        Every parameter given other than :param:`client` will be
        internally stored in ``_wrapped``.

        .. note::

        Attributes can be access using snake_case or lowerCamelCase.

        """
        self._username = username
        if kwargs:
            wrapped_doc.update(**kwargs)
        self._wrapped = wrapped_doc

    def to_dict(self):
        """Return wrapped doc as dict"""
        return self._wrapped.to_dict()

    def __getattr__(self, name):
        """Custom attribute getter for correct translation

        snake_case to lowerCamelCase translation happens here as well
        as wrapping nested objects in this class"""

        camel_name = ESUtils.to_camel_case(name)
        _wrapped = object.__getattribute__(self, '_wrapped')
        if camel_name not in _wrapped:
            return object.__getattribute__(self, name)

        val = getattr(_wrapped, camel_name)
        return val

    def __setattr__(self, name, value):
        if name not in ['_wrapped', '_username']:
            camel_name = ESUtils.to_camel_case(name)
            setattr(self._wrapped, camel_name, value)
            return

        super(BaseESResource, self).__setattr__(name, value)
