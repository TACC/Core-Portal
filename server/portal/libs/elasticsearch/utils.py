"""
Utilities to help on elastic search implementations.
"""
from __future__ import unicode_literals, absolute_import
import json
import os
import logging
from portal.libs.agave.utils import walk_levels

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

def index_agave(client, username, system, path,
                levels=0, index_pems=False):
    from portal.libs.elasticsearch.docs.files import BaseFile
    from portal.libs.agave.models.files import BaseFile as AgaveFile
    for root, folders, files in walk_levels(client, system, path):
        for obj in folders + files:
            obj_dict = obj.to_dict()
            obj_dict['pems'] = obj.pems_list()
            doc = BaseFile(username, **obj_dict)
            doc.save()

        es_children = BaseFile(username, system, root).children()
        children_paths = [_file.path.strip('/') for _file in folders + files]
        to_delete = [doc for doc in es_children if
                     doc is not None and
                     doc.path not in children_paths]
        for doc in to_delete:
            doc.delete()

        if levels and (len(root.strip('/').split('/')) -
                       len(path.strip('/').split('/')) + 1) >= levels:
            del folders[:]

    path_comps = path.strip('/').split('/')
    for i in range(len(path_comps)):
        parent_path = os.path.join(*path_comps)
        parent = AgaveFile(client, system, parent_path)
        parent_dict = parent.to_dict()
        if index_pems:
            parent_dict['pems'] = parent.pems_list()
        doc = BaseFile(username, **parent_dict)
        doc.save()
