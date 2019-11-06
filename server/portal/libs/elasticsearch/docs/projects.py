"""
.. module: portal.libs.elasticsearch.docs.projects
   :synopsis: Wrapper classes for ES ``projects`` doc type.
"""
import logging
import os
from django.conf import settings
from portal.libs.elasticsearch.docs.base import IndexedProject, BaseESResource
from portal.libs.elasticsearch.exceptions import DocumentNotFound


class BaseESProject(BaseESResource):
    def __init__(self, projectId, wrapped_doc=None, **kwargs):

        super(BaseESProject, self).__init__(wrapped_doc, **kwargs)
        if not wrapped_doc:
            self._populate(projectId, **kwargs)

    def _populate(self, projectId, **kwargs):
        try:
            self._wrapped = IndexedProject.from_id(projectId)
            if kwargs:
                self._wrapped.update(**kwargs)
        except DocumentNotFound:
            self._wrapped = IndexedProject(projectId=projectId, **kwargs)

    def save(self):
        return self._wrapped.save()

    def delete(self):
        return self._wrapped.delete()