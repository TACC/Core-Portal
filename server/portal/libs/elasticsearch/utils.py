"""
Utilities to help on elastic search implementations.
"""

import os
import logging
import datetime
from elasticsearch.helpers import bulk
from portal.libs.elasticsearch.docs.base import IndexedFile
from portal.libs.elasticsearch.exceptions import DocumentNotFound
from elasticsearch_dsl import MultiSearch
from elasticsearch_dsl.connections import get_connection
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


def index_level(path, folders, files, systemId, reindex=False):
    """
    Index a set of folders and files corresponding to the output from one
    iteration of walk_levels
    """

    for obj in folders + files:
        obj_dict = dict(obj)
        obj_dict['basePath'] = os.path.dirname(obj_dict['path'])
        try:
            doc = IndexedFile.from_path(obj_dict['system'], obj_dict['path'])
            doc.update(**obj_dict)
        except DocumentNotFound:
            doc = IndexedFile(**obj_dict)
            doc.save()

        # if update_pems:
        #    pems = obj.pems_list()
        #    doc._wrapped.update(**{'pems': pems})

    children_paths = [_file['path'] for _file in folders + files]
    for doc in IndexedFile.list_children(systemId, path):
        if doc.path not in children_paths:
            doc.delete_recursive()


def current_time():
    return datetime.datetime.now()


def index_listing(files):
    idx = IndexedFile.Index.name
    ms = MultiSearch()
    for file in files:
        q = IndexedFile.search()\
            .filter('term', **{'path._exact': file['path']})\
            .filter('term', **{'system._exact': file['system']})
        ms = ms.add(q)

    ops = []
    for i, res in enumerate(ms.execute()):
        file_dict = dict(files[i])
        file_dict['lastUpdated'] = current_time()
        file_dict['basePath'] = os.path.dirname(file_dict['path'])

        if not len(res):
            ops.append({
                '_index': idx,
                'doc': file_dict,
                '_op_type': 'index'
            })
        else:
            ops.append({
                '_index': idx,
                '_id': res[0].meta.id,
                'doc': file_dict,
                '_op_type': 'update'
            })

        for hit in res[1:]:
            ops.append({
                '_index': idx,
                '_id': hit.meta.id,
                '_op_type': 'delete'
            })

    bulk(get_connection('default'), ops)
