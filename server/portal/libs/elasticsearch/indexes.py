"""
.. module: portal.libs.elasticsearch.indexes
   :synopsis: ElasticSearch Index setup
"""
from __future__ import unicode_literals, absolute_import
import logging
from django.conf import settings
from elasticsearch_dsl import Index
from elasticsearch_dsl.connections import connections
from portal.libs.elasticsearch.docs.base import IndexedFile
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

def setup_indexes(name, force=False):
    index_var = 'ES_{}_INDEX'.format(name.upper())
    index_name = getattr(settings, index_var)
    index = Index(index_name)
    try:
        alias = getattr(settings, '{}_ALIAS'.format(index_var))
        aliases = {alias: {}}
        index.aliases(**aliases)
    except AttributeError:
        pass

    index.analyzer(path_analyzer)
    index.analyzer(file_analyzer)

    if force:
        index.delete(ignore=404)
    
    return index

def setup_files_index(force=False):
    index = setup_indexes('DEFAULT', force)
    index.doc_type(IndexedFile)
    index.create()
    # IndexedFile.init()
