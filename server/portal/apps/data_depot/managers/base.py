"""
.. module: apps.data_depot.managers.base
   :synopsis: Abstract classes to build Data Depot file managers.
"""
from __future__ import unicode_literals, absolute_import
import logging
import datetime
import os
from abc import ABCMeta, abstractmethod, abstractproperty
from six import add_metaclass
from future.utils import python_2_unicode_compatible
from cached_property import cached_property
from django.conf import settings
from django.urls import reverse
#from django.contrib.auth import get_user_model
from requests.exceptions import HTTPError
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.serializers import BaseAgaveFileSerializer
from portal.exceptions.api import ApiException

from portal.apps.search.tasks import agave_indexer
#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name

@add_metaclass(ABCMeta)
class AbstractFileManager:
    """Abstract class describing a File Manager needed to manage different
     data resources.

    .. rubric:: Rationale

    The *Data Depot* is meant to bring together data from multiple resources.
    The strings representing a file, storage structure, libraries, etc...
    used in different resources may be different. This abstract class
    allow us to standardize calls to different resources.

    .. rubric:: Usage

    When adding a new resource to the *Data Depot* a ``manager`` class
    should be implemented.
    Whe initializing a file manager, the current request will be sent as
    a parameter. This way the manager is in charge to initialize any
    client or other neede values based from the request being made or
    the user doing the request.

    .. note:: Most methods will accept a ``file_id`` parameter. This is a
     string representing the file and the format might be different from
     resource to resource. It is up to the developer to parse this string
     accordingly.
    """

    def __init__(self, request, **kwargs):#pylint: disable=unused-argument
        """Inspect the request object to initialize manager.

        :param request: Django request object.
        """
        try:
            self._ac = request.user.agave_oauth.client
            self.username = request.user.username
        except AttributeError:
            self._ac = None
            self.username = 'AnonymousUser'

    @abstractproperty
    def requires_auth(self):
        """Weather it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return False

    @abstractmethod
    def listing(self, file_id, **kwargs):
        """List file or folder contents.

        :param str file_id: Id representing file/folder listed.

        :returns: A listing object. See :class:`~libs.agave.models.file.BaseFile`.
        :rtype: obj
        """
        return NotImplemented

    @abstractmethod
    def copy(self, file_id_src, file_id_dest, **kwargs):
        """Copy a file.

        :param str file_id_src: Id representing file/folder.
        :param str file_id_dest: Id representing file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    @abstractmethod
    def delete(self, file_id, **kwargs):
        """Delete a file.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    @abstractmethod
    def download(self, file_id, **kwargs):
        """Download a file.

        :param str file_id: Id representing a file/folder.

        :returns: Downloaded file stream.
        :rtype: byte[]
        """
        return NotImplemented

    @abstractmethod
    def share(self, file_id, **kwargs):
        """Return file's permissions.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    @abstractmethod
    def mkdir(self, file_id, **kwargs):
        """Create a directory.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    @abstractmethod
    def move(self, file_id_src, file_id_dest, **kwargs):
        """Move a file.

        :param str file_id_src: Id representing file/folder.
        :param str file_id_dest: Id representing file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented


    @abstractmethod
    def update_pems(self, file_id, pems, **kwargs):
        """Update permissions on a file.

        :param str file_id: Id representing a file/folder.
        :param list pems: List with permissions. Each object in the list
         must be a dict with *at least* two keys ``username``: a string
         and ``pem``: a string with the permission value. If the target
         resource were to need more data to update the permissions, the
         manager implementation should take care of this.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    @abstractmethod
    def upload(self, file_id_dest, uploaded_files, **kwargs):
        """Upload one or more files.

        :param str file_id_dest: Id representing a file/folder.
        :param list uploaded_files: List of uploaded files.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

@python_2_unicode_compatible
class AgaveFileManager(AbstractFileManager):
    """File Manager handling private data from Agave.
    """
    def __init__(self, client, **kwargs):#pylint: disable=super-init-not-called
        """Initializing client data.

        The Agave client is initialized. The session key and username are
        also stored on the instance level for debugging.

        :param request: Django request object.
        """
        self._ac = client
        self.serializer_cls = BaseAgaveFileSerializer

    def _parse_file_id(self, file_id):
        """Parse a file id.

        :param str file_id: Id representing a file.

        :return: system, path.
        :rtype: tuple

        .. note:: The file id sent by the front-end should be of the form:
        <system>/<file_path>
        """
        id_comps = file_id.strip('/').split('/')
        system = id_comps[0]
        if len(id_comps[1:]):
            file_path = os.path.join(*id_comps[1:])
        else:
            file_path = '/'

        return (system, file_path)

    def get_file(self, file_id, **kwargs):
        """Convinience method to initialize a file quickly.

        :param str file_id: Id representing a file.

        :return: A file obj.
        :rtype: :class:`~libs.agave.models.files.BaseFile`
        """
        system, path = self._parse_file_id(file_id)
        _file = BaseFile(self._ac, system, path)
        return _file

    @property
    def encoder_cls(self):
        """Returns encoder cls"""
        return self.serializer_cls

    @property
    def requires_auth(self):
        """Weather it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return True

    def listing(self, file_id, **kwargs):
        """List file or folder contents.

        :param str file_id: Id representing file/folder listed.

        :returns: A listing object. See :class:`~libs.agave.models.file.BaseFile`.
        :rtype: obj
        """
        _file = self.get_file(file_id)
        page = kwargs.get('page', None)
        if page is not None:
            offset = page * settings.PORTAL_DATA_DEPOT_PAGE_SIZE
        else:
            offset = kwargs.get('offset', 0)

        limit = kwargs.get('limit', settings.PORTAL_DATA_DEPOT_PAGE_SIZE)
        _file.children(offset=offset, limit=limit)
        return _file

    def copy(self, file_id_src, file_id_dest, **kwargs):
        """Copy a file.

        :param str file_id_src: Id representing file/folder.
        :param str file_id_dest: Id representing file/folder.

        :returns: A file object.
        :rtype: obj

        .. todo::
            Correct validation for :param:`file_id_dest`.
        """
        _file_src = self.get_file(file_id_src)
        _file_dest = self.get_file(file_id_dest)
        if _file_src.system == _file_dest.system:
            resp = _file_src.copy(_file_dest.path)
            agave_indexer.apply_async(kwargs={'systemId': _file_src.system}, routing_key='indexing')
        else:
            resp = _file_dest.import_data(_file_src.system, _file_src.path)
            agave_indexer.apply_async(kwargs={'systemId': _file_src.system}, routing_key='indexing')
            agave_indexer.apply_async(kwargs={'systemId': _file_dest.system}, routing_key='indexing')

        
        return resp

    def delete(self, file_id, **kwargs):
        """Delete a file.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        _file = self.get_file(file_id)
        if _file.path.strip('/').split('/', 1) == "Trash":
            self.trash(_file)
            return True

        return _file.delete()

    def download(self, file_id, preview=True, **kwargs):
        """Download a file.

        :param str file_id: Id representing a file/folder.

        :returns: Downloaded file stream.
        :rtype: byte[]

        .. todo::
            Implement folder download.
        """
        _file = self.get_file(file_id)
        if _file.type == 'dir':
            raise ValueError('Cannot download a folder')

        if not preview:
            return _file.download()

        # if force=True (which is default), agave will automatically
        # set the Content-Disposition for download
        url = _file.postit(force=False)

        if _file.ext in BaseFile.SUPPORTED_TEXT_PREVIEW_EXTS:
            file_type = 'text'
        elif _file.ext in BaseFile.SUPPORTED_IMAGE_PREVIEW_EXTS:
            file_type = 'image'
        elif _file.ext in BaseFile.SUPPORTED_OBJECT_PREVIEW_EXTS:
            file_type = 'object'
        elif _file.ext in BaseFile.SUPPORTED_MS_OFFICE:
            file_type = 'ms-office'
            url = 'https://view.officeapps.live.com/op/view.aspx?src={}'.\
                  format(url)
        elif _file.ext in BaseFile.SUPPORTED_IPYNB_PREVIEW_EXTS:
            file_type = 'ipynb'
            tmp = url.lstrip('https://')
            url = 'https://nbviewer.jupyter.org/urls/{tmp}'.format(tmp=tmp)
        else:
            raise ApiException('Cannot preview this item')
        return {'href': url, 'fileType': file_type}

    def pems(self, file_id, username=None, **kwargs):
        """Return file's permissions.

        :param str file_id: Id representing a file/folder.
        :param str username: Optionally, give a username to return that
         user's permissions.

        :returns: A list of permissions.
        :rtype: list
        """
        system, path = self._parse_file_id(file_id)
        pems = self._ac.files.listPermissions(systemId=system,
                                              filePath=path)
        if username is not None:
            pems = [p for p in pems if p['username'] == username]

        return pems

    def mkdir(self, file_id, name, **kwargs):
        """Create a directory.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        _file = self.get_file(file_id)
        parent = _file.trail[-1] or BaseFile(self._ac,
                                             system=_file.system,
                                             path='/')
        try:
            resp = parent.mkdir(name)
        except HTTPError as err:
            if err.response.status_code == 404:
                resp = BaseFile.ensure_path(self._ac,
                                            _file.system,
                                            _file.path)
            else:
                raise
        agave_indexer.apply_async(kwargs={'systemId': _file.system}, routing_key='indexing')
        return resp

    def move(self, file_id_src, file_id_dest, **kwargs):
        """Move a file.

        :param str file_id_src: Id representing file/folder.
        :param str file_id_dest: Id representing file/folder.

        :returns: A file object.
        :rtype: obj
        """
        logger.info(file_id_src)
        _file_src = self.get_file(file_id_src)
        _file_dest = self.get_file(file_id_dest)
        # try:
        #     BaseFile.listing(self._ac, system=_file_dest.system, path=_file_dest.path)
        #     raise Exception('Destination already exists.')
        # except HTTPError as err:
        #     if err.response.status_code != 404:
        #         raise

        if _file_src.system == _file_dest.system:
            _file_src.move(_file_dest.system, _file_dest.path)
            agave_indexer.apply_async(kwargs={'systemId': _file_src.system}, routing_key='indexing')
        else:
            _file_dest.importData(_file_src.system, _file_src.path)
            _file_src.delete()
            agave_indexer.apply_async(kwargs={'systemId': _file_src.system}, routing_key='indexing')
            agave_indexer.apply_async(kwargs={'systemId': _file_dest.system}, routing_key='indexing')

        return _file_dest

    def rename(self, file_id_src, rename_to, **kwargs):
        """Rename a file.

        :param str file_id_src: Id representing file/folder.
        :param str rename_to: New name value.

        :returns: A file object.
        :rtype: obj
        """
        _file = self.get_file(file_id_src)
        try:
            renamed_path = os.path.join(_file.parent_path, rename_to)
            BaseFile.listing(self._ac, system=_file.system,
                             path=renamed_path)
        except HTTPError as err:
            if err.response.status_code != 404:
                raise

        _file.rename(rename_to)
        agave_indexer.apply_async(kwargs={'systemId': _file.system}, routing_key='indexing')
        return _file

    def share(self, file_id, **kwargs):
        """Return file's permissions.

        :param str file_id: Id representing a file/folder.

        :returns: Boolean
        :rtype: bool
        """
        return self

    def trash(self, file_id, **kwargs):
        """Move file to trash folder.

        :param file_obj: :class:`~libs.agave.models.file.BaseFile` obj
         to move to trash.
        :type file_obj: :class:`~libs.agave.models.file.BaseFile`.

        :returns: A file object.
        :rtype: :class:`~libs.agave.models.file.BaseFile`
        """
        _file = self.get_file(file_id)
        BaseFile.ensure_path(self._ac,
                             _file.system,
                             settings.AGAVE_DEFAULT_TRASH_NAME)
        trash_path = os.path.join(settings.AGAVE_DEFAULT_TRASH_NAME,
                                  _file.name)
        trash_name = _file.name
        try:
            BaseFile.listing(client=self._ac,
                             system=_file.system,
                             path=trash_path)
            #Trash path exists, must make it unique.
            _ext = _file.ext
            _name = os.path.splitext(_file.name)[0]
            now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            trash_name = '{}_{}.{}'.format(_name, now, _ext)
        except HTTPError as err:
            if err.response.status_code != 404:
                raise

        file_id_src = '{}/{}'.format(_file.system, _file.path)
        file_id_dest = '{}/{}/{}'.format(_file.system, settings.AGAVE_DEFAULT_TRASH_NAME,
                                         trash_name)
        resp = _file.move(file_id_src, file_id_dest)
        agave_indexer.apply_async(kwargs={'systemId': _file.system}, routing_key='indexing')
        return resp

    def update_pems(self, file_id, pems, **kwargs):
        """Update permissions on a file.

        :param str file_id: Id representing a file/folder.
        :param list pems: List with permissions. Each object in the list
         must be a dict with *at least* two keys ``username``: a string
         and ``pem``: a string with the permission value. If the target
         resource were to need more data to update the permissions, the
         manager implementation should take care of this.

        :returns: A file object.
        :rtype: obj
        """
        _file = self.get_file(file_id)
        for pem in pems:
            _file.share(pem['username'], pem['permission'])
        agave_indexer.apply_async(kwargs={'systemId': _file.system, 
                                          'filePath': _file.path,
                                          'update_pems': True})
        return _file

    def upload(self, file_id_dest, uploaded_files, ensure_path=False,
               **kwargs):
        """Upload one or more files.

        :param str file_id_dest: Id representing a file/folder.
        :param list uploaded_files: List of uploaded files.
        :param bool ensure_path: If True the path of the uploaded
         files will be created if it does not exists.

        :returns: A file object.
        :rtype: obj
        """
        system, path = self._parse_file_id(file_id_dest)
        try:
            _file = BaseFile.listing(self._ac, system=system, path=path)
        except HTTPError as err:
            if err.response.status_code != 404:
                raise
            else:
                _file = BaseFile(self._ac, system=system, path=path,
                                 type='file')

        for uploaded_file in uploaded_files:
            _file.upload(uploaded_file)

        agave_indexer.apply_async(kwargs={'systemId': system}, routing_key='indexing')
        return _file
