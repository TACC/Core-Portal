"""
.. module: portal.libs.elasticsearch.docs.projects
   :synopsis: Wrapper classes for ES ``projects`` doc type.
"""

from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import os
from django.conf import settings
from portal.libs.elasticsearch.docs.base import IndexedProject, BaseESResource
from portal.libs.elasticsearch.exceptions import DocumentNotFound

class BaseESProject(BaseESResource):
    def __init__(self, projectId, wrapped_doc=None, **kwargs):
        if wrapped_doc:
            super(BaseESProject, self).__init__(projectId, wrapped_doc, **kwargs)
        else:
            try:
                wrapped_doc = IndexedProject.from_id(projectId)
                super(BaseESProject, self).__init__(projectId, wrapped_doc, **kwargs)
            except DocumentNotFound:
                wrapped_doc = IndexedProject(projectId=projectId, **kwargs)
                super(BaseESProject, self).__init__(projectId, wrapped_doc)

    def save(self):
        return self._wrapped.save()

    def delete(self):
        return self._wrapped.delete()