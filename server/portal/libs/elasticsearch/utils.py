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

def index_agave(systemId, client, username, filePath='/', update_pems=False):
    from portal.libs.elasticsearch.docs.files import BaseESFile

    for root, folders, files in walk_levels(client, systemId, filePath, ignore_hidden=True):
        # obj_to_index = filter(lambda _obj: _obj.name[0] != '.', folders + files)
        # obj_to_index = folders + files
        for obj in folders + files:
            obj_dict = obj.to_dict()
            doc = BaseESFile(username, **obj_dict)
            saved = doc.save()
            if saved or update_pems:
                pems = obj.pems_list()
                doc._wrapped.update(**{'pems': pems})

        es_children = BaseESFile(username, systemId, root).children()
        children_paths = [_file.path for _file in folders + files]
        to_delete = [doc for doc in es_children if
                     doc is not None and
                     doc.path not in children_paths]
        for doc in to_delete:
            doc.delete()
