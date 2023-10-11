"""
Utilities to help on elastic search implementations.
"""

import os
import logging
import datetime
from elasticsearch.helpers import bulk
from elasticsearch_dsl import Q
from elasticsearch_dsl.connections import get_connection
from hashlib import sha256
from itertools import zip_longest
# from portal.apps.projects.models import ProjectMetadata

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


def index_project(projectId):
    #     from portal.libs.elasticsearch.docs.projects import BaseESProject
    #     project_meta = ProjectMetadata.objects.get(project_id=projectId)
    #     project_meta_dict = project_meta.to_dict()

    #     doc = BaseESProject(**project_meta_dict)
    #     doc.save()
    pass


def get_sha256_hash(string):
    """
    Compute sha256 hash of a string as a UUID for indexing.

    Parameters
    ----------
    string: str
        String to hash.

    Returns
    -------
    str
    """
    return sha256((string).encode()).hexdigest()


def file_uuid_sha256(system, path):
    """
    Compute sha256 hash of a system/path combination as a UUID for indexing.

    Parameters
    ----------
    system: str
        The Tapis system ID.
    path: str
        Path to file file being indexed, relative to the storage system root.

    Returns
    -------
    str
    """

    if not path.startswith('/'):
        path = '/{}'.format(path)
    # str representation of the hash of e.g. "cep.home.user/path/to/file"
    return sha256((system + path).encode()).hexdigest()


def grouper(iterable, n, fillvalue=None):
    """
    Recipe from itertools docs.
    Collect data into fixed-length chunks or blocks.
    """
    # grouper('ABCDEFG', 3, 'x') --> ABC DEF Gxx"
    args = [iter(iterable)] * n
    return zip_longest(*args, fillvalue=fillvalue)


def walk_children(system, path, include_parent=False, recurse=False):
    """
    Yield an elasticsearch hit for each child of an indexed file.

    Parameters
    ----------
    system: str
        The Tapis system ID.
    path: str
        The path relative to the system root.
    include_parent: bool
        Whether the listing should include the parent as well as the children.
    recurse: bool
        If True, simulate a recursive listing by doing a prefix search on the
        root path.

    Yields
    ------
    elasticsearch_dsl.response.hit.Hit

    """
    from portal.libs.elasticsearch.docs.base import IndexedFile
    search = IndexedFile.search()
    search = search.filter(Q({'term': {'system._exact': system}}))
    if recurse:
        basepath_query = Q({'prefix': {'basePath._exact': path}})
    else:
        basepath_query = Q({'term': {'basePath._exact': path}})

    if include_parent:
        path_query = Q({'term': {'path._exact': path}})
        search = search.filter(basepath_query | path_query)
    else:
        search = search.filter(basepath_query)

    for hit in search.scan():
        yield hit


def delete_recursive(system, path):
    """
    Recursively delete all Elasticsearch documents in a specified system/path.

    Parameters
    ----------
    system: str
        The Tapis system ID containing files to be deleted.
    path: str
        The path relative to the system root. All documents with this path as a
        prefix will be deleted.

    Returns
    -------
    Void
    """
    from portal.libs.elasticsearch.docs.base import IndexedFile
    hits = walk_children(system, path, include_parent=True, recurse=True)
    idx = IndexedFile.Index.name
    client = get_connection('default')

    # Group children in batches of 100 for bulk deletion.
    for group in grouper(hits, 100):
        filtered_group = filter(lambda hit: hit is not None, group)
        ops = map(lambda hit: {'_index': idx,
                               '_id': hit.meta.id,
                               '_op_type': 'delete'},
                  filtered_group)
        bulk(client, ops)


def index_level(path, folders, files, systemId, reindex=False):
    """
    Index a set of folders and files corresponding to the output from one
    iteration of walk_levels

    Parameters
    ----------
    path: str
        The path to the parent folder being indexed, relative to the system root.
    folders: list
        list of Tapis folders (either dict or agavepy.agave.Attrdict)
    files: list
        list of Tapis files (either dict or agavepy.agave.Attrdict)
    systemId: str
        ID of the Tapis system being indexed.

    Returns
    -------
    Void
    """

    index_listing(folders + files)

    children_paths = [_file['path'] for _file in folders + files]
    for hit in walk_children(systemId, path, recurse=False):
        if hit['path'] not in children_paths:
            delete_recursive(hit.system, hit.path)


def current_time():
    """
    Wraps datetime.datetime.now() for convenience of mocking.

    Returns
    -------
    datetime.datetime
    """
    return datetime.datetime.now()


def index_listing(files):
    """
    Index the result of a Tapis listing. Files are indexed with a UUID
    comprising the SHA256 hash of the system + path.

    Parameters
    ----------
    files: list
        list of Tapis files (either dict or agavepy.agave.Attrdict)

    Returns
    -------
    Void
    """
    from portal.libs.elasticsearch.docs.base import IndexedFile
    idx = IndexedFile.Index.name
    client = get_connection('default')
    ops = []
    for _file in files:
        file_dict = dict(_file)
        if file_dict['name'][0] == '.':
            continue
        if not file_dict['path'].startswith('/'):
            file_dict['path'] = '/' + file_dict['path']
        file_dict['lastUpdated'] = current_time()
        file_dict['basePath'] = os.path.dirname(file_dict['path'])
        file_uuid = file_uuid_sha256(file_dict['system'], file_dict['path'])
        ops.append({
            '_index': idx,
            '_id': file_uuid,
            'doc': file_dict,
            '_op_type': 'update',
            'doc_as_upsert': True
            })

    bulk(client, ops)


def index_project_listing(projects):
    from portal.libs.elasticsearch.docs.base import IndexedProject

    idx = IndexedProject.Index.name
    client = get_connection('default')
    ops = []

    for _project in projects:
        project_dict = dict(_project)
        project_dict['lastUpdated'] = current_time()
        project_uuid = get_sha256_hash(project_dict['id'])
        ops.append({
            '_index': idx,
            '_id': project_uuid,
            'doc': project_dict,
            '_op_type': 'update',
            'doc_as_upsert': True
        })

    bulk(client, ops)
