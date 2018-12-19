"""
.. module: portal.libs.elasticsearch.indexes
   :synopsis: ElasticSearch Index setup
"""
from __future__ import unicode_literals, absolute_import
from datetime import datetime
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

def setup_indexes(name, key, force=False):
    """
    Set up an index with a name and alias key. The key should correspond
    to a settings variable in the format 'ES_{}_INDEX_ALIAS'.format(key).
    The behavior of the function is as follows:
     - If an index exists under the provided alias and force=False, just return
       the existing index.
     - If an index exists under the provided alias and force=True, then delete
       any indices under that alias and create a new index with that alias
       and the provided name.
     - If an index does not exist under the provided alias, then create a new
       index with that alias and the provided name.
    """
    alias = getattr(settings, 'ES_{}_INDEX_ALIAS'.format(key.upper()))
    index = Index(alias)

    if force or not index.exists():
        # If an index exists under the alias and force=True, delete any indices
        # with that alias.
        while index.exists():
            index.delete(ignore=404)
            index = Index(alias)
        # Create a new index with the provided name.
        index = Index(name)
        # Alias this new index with the provided alias key.
        aliases = {alias: {}}
        index.aliases(**aliases)

    return index

def setup_files_index(key='DEFAULT', force=False):
    time_now = datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")
    name = DEFAULT_INDEX + '-' + time_now
    index = setup_indexes(name, key, force)
    if not index.exists():
        index.doc_type(IndexedFile)
        index.create()
