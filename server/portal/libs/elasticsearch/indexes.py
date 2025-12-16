"""
.. module: portal.libs.elasticsearch.indexes
   :synopsis: ElasticSearch Index setup
"""
from datetime import datetime
import logging
from django.conf import settings
from elasticsearch_dsl import Index
from portal.libs.elasticsearch.docs.base import (IndexedFile,
                                                 IndexedAllocation,
                                                 IndexedProject, IndexedPublication)
from portal.libs.elasticsearch.analyzers import file_query_analyzer


logger = logging.getLogger(__name__)


def setup_indexes(doc_type, reindex=False, force=False):
    """
    Set up an index given a doc_type (e.g. files, projects).
    The behavior of the function is as follows:
     - If an index exists under the provided alias and force=False, just return
       the existing index.
     - If an index exists under the provided alias and force=True, then delete
       any indices under that alias and create a new index with that alias
       and the provided name.
     - If an index does not exist under the provided alias, then create a new
       index with that alias and the provided name.
    """
    baseName = settings.ES_INDEX_PREFIX.format(doc_type)
    indexName = '{}-{}'.format(baseName, index_time_string())
    alias = baseName
    if reindex:
        alias += '-reindex'

    index = Index(alias)
    if force or not index.exists():
        # If an index exists under the alias and force=True, delete any indices
        # with that alias.
        while index.exists():
            Index(list(index.get_alias().keys())[0]).delete(ignore=404)
            index = Index(alias)
        # Create a new index with the provided name.
        index = Index(indexName)
        # Alias this new index with the provided alias key.
        aliases = {alias: {}}
        index.aliases(**aliases)

    return index


def index_time_string():
    """Get the current string-formatted time for use in index names."""
    return datetime.now().strftime("%Y_%m_%d_%H_%M_%S_%f")


def setup_files_index(reindex=False, force=False):
    index = setup_indexes('files', reindex, force)
    if not index.exists():
        index.document(IndexedFile)
        index.analyzer(file_query_analyzer)
        index.settings(number_of_shards=3)
        index.create()


def setup_allocations_index(reindex=False, force=False):
    index = setup_indexes('allocations', reindex, force)
    if not index.exists():
        index.document(IndexedAllocation)
        index.create()


def setup_projects_index(reindex=False, force=False):
    index = setup_indexes('projects', reindex, force)
    if not index.exists():
        index.document(IndexedProject)
        index.create()

def setup_publications_index(reindex=False, force=False):
    index = setup_indexes('publications', reindex, force)
    if not index.exists():
        index.document(IndexedPublication)
        index.create()