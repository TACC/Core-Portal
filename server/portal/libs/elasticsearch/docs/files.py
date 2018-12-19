"""
.. module: portal.libs.elasticsearch.docs.files
   :synopsis: Wrapper classes for ES ``files`` doc type.
"""
from __future__ import unicode_literals, absolute_import
from future.utils import python_2_unicode_compatible
import logging
import os
from django.conf import settings
from portal.libs.elasticsearch.docs.base import IndexedFile, ReindexedFile, BaseESResource
from portal.libs.elasticsearch.exceptions import DocumentNotFound

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@python_2_unicode_compatible
class BaseESFile(BaseESResource):
    """Wrapper class for Elastic Search indexed file.

    .. rubric:: Rationale

    This wrapper class is needed in order to separate concerns.
    Any thing specific to Elastic Search must live in
    :mod:`libs.elasticsearch.docs.base` and any logic needed
    to manipulate data must live here.
    Also, by manipulating data outside a ``DocType`` subclass
    we avoid the use of ``AttrDict`` and ``AttrList``.

    """
    def __init__(self, username, system=settings.AGAVE_STORAGE_SYSTEM,
                 path='/', wrapped_doc=None, reindex=False, **kwargs):
        """Elastic Search File representation.

        This class directly wraps an Agave indexed file.

        """
        if reindex:
            self.indexed_file_cls = ReindexedFile
        else:
            self.indexed_file_cls = IndexedFile
        
        if wrapped_doc:
            super(BaseESFile, self).__init__(username, wrapped_doc, **kwargs)
        else: 
            try:
                wrapped_doc = self.indexed_file_cls.from_path(username, system, path)
                super(BaseESFile, self).__init__(username, wrapped_doc, **kwargs)
            except DocumentNotFound:
                wrapped_doc = self.indexed_file_cls(system=system,
                                            path=path,
                                            **kwargs)
                super(BaseESFile, self).__init__(username, wrapped_doc)
        if getattr(self, 'name', None) is None:
            self._wrapped.name = os.path.basename(self.path)

    def children(self, offset=0, limit=100):
        """Children list

        """
        try:
            res, search = self.indexed_file_cls.children(self._username,
                                                    self.system,
                                                    self.path)
            limit = offset+limit
            for doc in search[offset:limit]:
                yield BaseESFile(self._username, doc.system, doc.path)

        except DocumentNotFound:
            pass

    def save(self, using=None, index=None, validate=True, **kwargs):
        """Save document

        """
        base_path = os.path.dirname(self.path)
        self._wrapped.basePath = base_path
        return self._wrapped.save()

    def delete(self, using=None, index=None, **kwargs):
        """Overwriting to implement delte recursively.

        :param index: elasticsearch index to use.
        :param using: connection alias to use.

        .. seealso:
            Module :class:`elasticsearch_dsl.document.DocType`

        """
        if self.format == 'folder':
            children = self.children()
            for child in children:
                child.delete(using, index, **kwargs)
        self._wrapped.delete(using, index, **kwargs)
