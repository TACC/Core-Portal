"""
Utilities to help on elastic search implementations.
"""
import json
import os
import logging
from portal.libs.agave.utils import walk_levels
# from portal.apps.projects.models import ProjectMetadata

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

def to_camel_case(input_str):
    """Convert from snake_case to lowerCamelCase.

    This is mainly used to translate between
    python_attributes and jsonAttributes.
    Agavepy returns python dicts with jsonAttrbiutes for keys.

    :param str input_str:
    :return: lowerCamelCase string
    :rtype: str
    """
    left_cnt = len(input_str) - len(input_str.lstrip('_'))
    right_cnt = len(input_str) - len(input_str.rstrip('_'))
    comps = input_str[left_cnt:].split('_')
    right_side = ''.join(w.title() for w in comps[1:])
    camel_case = ''.join(['_' * left_cnt, comps[0], right_side, '_' * right_cnt])
    return camel_case

def index_project(projectId):
#     from portal.libs.elasticsearch.docs.projects import BaseESProject
#     project_meta = ProjectMetadata.objects.get(project_id=projectId)
#     project_meta_dict = project_meta.to_dict()

#     doc = BaseESProject(**project_meta_dict)
#     doc.save()
    pass

def index_agave(systemId, client, username, filePath='/', update_pems=False):
    from portal.libs.elasticsearch.docs.files import BaseESFile

    for root, folders, files in walk_levels(client, systemId, filePath, ignore_hidden=True):
        for obj in folders + files:
            obj_dict = obj.to_dict()
            doc = BaseESFile(username, **obj_dict)
            saved = doc.save()
            if update_pems:
                pems = obj.pems_list()
                doc._wrapped.update(**{'pems': pems})

        offset = 0
        limit = 100
        es_root = BaseESFile(username, systemId, root)
        page = [doc for doc in es_root.children(offset=offset, limit=limit)]
        children_paths = [_file.path for _file in folders + files]

        while len(page) > 0:
            to_delete = [doc for doc in page if
                        doc is not None and
                        doc.path not in children_paths]
            for doc in to_delete:
                doc.delete()

            offset += limit
            page = [doc for doc in es_root.children(offset=offset, limit=limit)]

def index_level(path, folders, files, systemId, reindex=False):
    """
    Index a set of folders and files corresponding to the output from one
    iteration of walk_levels
    """
    from portal.libs.elasticsearch.docs.files import BaseESFile
    for obj in folders + files:
            obj_dict = obj.to_dict()
            obj_dict['basePath'] = os.path.dirname(obj.path)
            doc = BaseESFile(reindex=reindex, **obj_dict)
            saved = doc.save()

            #if update_pems:
            #    pems = obj.pems_list()
            #    doc._wrapped.update(**{'pems': pems})

    children_paths = [_file.path for _file in folders + files]
    es_root = BaseESFile(systemId, path, reindex=reindex)
    for doc in es_root.children():
        if doc is not None and doc.path not in children_paths:
            doc.delete()

