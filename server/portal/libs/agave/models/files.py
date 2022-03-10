"""
.. module: portal.libs.agave.models.files
   :synopsis: Models to represent resources pertaining to Agave Files
"""
import os
import json
import logging
import urllib.parse
from requests.exceptions import HTTPError
from django.conf import settings
from cached_property import cached_property
from .base import BaseAgaveResource

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


# pylint: disable=too-many-instance-attributes
# pylint: disable=too-many-public-methods
class BaseFile(BaseAgaveResource):
    """Represents and Agave File
    """

    SUPPORTED_MS_WORD = [
        '.doc', '.dot', '.docx', '.docm', '.dotx', '.dotm', '.docb',
    ]
    SUPPORTED_MS_EXCEL = [
        '.xls', '.xlt', '.xlm', '.xlsx', '.xlsm', '.xltx', '.xltm',
    ]
    SUPPORTED_MS_POWERPOINT = [
        '.ppt', '.pot', '.pps', '.pptx', '.pptm',
        '.potx', '.ppsx', '.ppsm', '.sldx', '.sldm',
    ]

    SUPPORTED_MS_OFFICE = (
        SUPPORTED_MS_WORD +
        SUPPORTED_MS_POWERPOINT +
        SUPPORTED_MS_EXCEL
    )

    SUPPORTED_IMAGE_PREVIEW_EXTS = [
        '.png', '.gif', '.jpg', '.jpeg',
    ]

    SUPPORTED_TEXT_PREVIEW_EXTS = [
        '.as', '.as3', '.asm', '.bat', '.c', '.cc', '.cmake', '.cpp',
        '.cs', '.css', '.csv', '.cxx', '.diff', '.groovy', '.h', '.haml',
        '.hh', '.htm', '.html', '.java', '.js', '.less', '.m', '.make', '.md',
        '.ml', '.mm', '.msg', '.php', '.pl', '.properties', '.py', '.rb',
        '.sass', '.scala', '.script', '.sh', '.sml', '.sql', '.txt', '.vi',
        '.vim', '.xml', '.xsd', '.xsl', '.yaml', '.yml', '.tcl', '.json',
        '.out', '.err', '.f',
    ]

    SUPPORTED_OBJECT_PREVIEW_EXTS = [
        '.pdf',
    ]

    SUPPORTED_IPYNB_PREVIEW_EXTS = [
        '.ipynb'
    ]

    SUPPORTED_PREVIEW_EXTENSIONS = (SUPPORTED_IMAGE_PREVIEW_EXTS +
                                    SUPPORTED_TEXT_PREVIEW_EXTS +
                                    SUPPORTED_OBJECT_PREVIEW_EXTS +
                                    SUPPORTED_MS_OFFICE +
                                    SUPPORTED_IPYNB_PREVIEW_EXTS)

    def __init__(
            self,
            client,
            system=settings.AGAVE_STORAGE_SYSTEM,
            path='/',
            **kwargs
    ):
        """Agave File representation

        By default this class does not retrieve the file object from Agave.
        This is to save lower latency. The file object is retrieved only when
        applying an action to it.

        .. note:: The attributes set here are used for readability. When ever an attribute
         is accessed we look at the ``_wrapped`` dict to see if the value exists. After this
         then we take a look at instance and class attributes. The 'jupyter_url' attribute
         in _wrapped is one such attribute. In this case, jupyter_url (a mapping of
         an Agave file to a portal's Jupyter Notebook URL) is computed during
         file listing and must be included in the serialized BaseFile, though it is not
         a value that is retrieved from Agave.
        """
        # kwargs.pop('permissions', None)
        super(BaseFile, self).__init__(
            client,
            system=system,
            path=path,
            **kwargs
        )
        self.name = getattr(self, 'name', None)
        self.path = getattr(self, 'path', None)
        self.last_modified = getattr(self, 'last_modified', None)
        self.length = getattr(self, 'length', None)
        self.format = getattr(self, 'format', None)
        self.mime_type = getattr(self, 'mime_type', None)
        self.type = getattr(self, 'type', None)
        self.system = getattr(self, 'system', None)
        self._links = getattr(self, '_links', None)
        self._children = getattr(self, '_children', None)
        self._metadata = getattr(self, '_metadata', None)
        if self.name is None:
            self.name = os.path.basename(self.path)

        self.jupyter_url = getattr(self, 'jupyter_url', None)
        self._wrapped['jupyter_url'] = None

    def __str__(self):
        return 'agave://{}/{}'.format(self.system, self.path)

    def __repr__(self):
        return '<{}: {}/{}>'.format(self.__class__.__name__,
                                     self.system, self.path)

    @property
    def agave_uri(self):
        """Agave URI as string

        :returns: Agave URI
        :rtype: str
        """
        return 'agave://{}/{}'.format(self.system, self.path)

    def children(self, offset=0, limit=100):
        """List of children

        :returns: :class:`BaseFile` list
        :rtype: list

        .. warning:: This method will "cache" the children list.
            If there's a need to force re-load of the children list you can set
            this to ``None`` and access the property again.
        >>> _dir = BaseFile(system='system.id', path='/folder')
        >>> _dir.children()
        >>> #[<BaseFile: system.id/children1>]
        >>> with open('/path/to/local/file.txt', 'rb') as _file:
        >>>     _dir.upload(_file)
        >>> _dir.children()
        >>> #[<BaseFile: system.id/children1>]
        >>> _dir.set_children(None)
        >>> _dir.children()
        >>> #[<BaseFile: system.id/folder/children1>,
        >>> # <BaseFile: system.id/folder/file.txt>]
        """
        if self.type is None:
            self._populate_obj()

        if self.type == 'dir' and self._children is None:
            listing = self.listing(self._ac, self.system, self.path,
                                   offset=offset, limit=limit)
            self._children = listing.children()
            # pylint: disable=protected-access
            self._children = listing._children
            self._wrapped = listing._wrapped

        return self._children

    def set_children(self, value):
        """Sets children value

        Used mainly by :meth:`listing` method.
        """
        self._children = value

    @cached_property
    def ext(self):
        """File Extension

        :returns: file extension
        :rtype: str
        """
        return os.path.splitext(self.name)[1].lower()

    @cached_property
    def previewable(self):
        """Is file previewable.

        Checks if the file extension exists in SUPPORTED_PREVIEW_EXTENSIONS

        :returns: True or False
        :rtype: bool
        """
        return self.ext in self.SUPPORTED_PREVIEW_EXTENSIONS

    @cached_property
    def trail(self):
        """File trail of entire path.

        Parses the path and constructs a list of :class:`BaseFile` objects
        representing each one of the parent folders.

        :returns: list of :class:`BaseFile`
        :rtype: list

        .. note:: This list can be used to navigate upwards a folder
        or to construct breadcrumbs.

        :Example:

        >>> #Getting the parent directory
        >>> output = BaseFile.listing(
        ...     agave_client,
        ...     'system.id',
        ...     'path/to/file.out'
        ... )
        >>> parent_dir = output.trail[-1]
        >>> #Create a directory in the parent directory
        >>> new_directory = parent_dir.mkdir('new_directory')
        """
        path_comps = self.path.split('/')
        trail = [BaseFile(
            client=self._ac,
            system=self.system,
            path='/'.join(path_comps[0:i+1])
        ) for i in range(len(path_comps))]
        return trail

    # .. todo:: #TODO: implement this.
    # @cached_property
    # def metadata(self)

    @cached_property
    def uuid(self):
        """File UUID

        :returns: UUID of file
        :rtype: str

        .. warning:: As of Jun/2017 the only way to get a file UUID is to
            list that specific file and parse the UUID from the ``_links``
            value. This means that if this object was instantiated as a trail
            object then an extra call to Agave need to be made in order to
            retrieve the UUID.
        """
        self._populate_obj()
        try:
            getattr(self._links, 'metadata')
        except AttributeError:
            # obj is not completely populated, force it.
            self._links = None
            self._populate_obj()
        try:
            metadata = self._links.metadata
            href = urllib.parse.urlparse(metadata.href)
            query = urllib.parse.parse_qs(href.query)
            if 'q' in query:
                meta = json.loads(query['q'][0])
                return meta.get('associationIds')

        except AttributeError:
            raise
        return None

    @property
    def parent_path(self):
        """Return parent path

        :return: parent path
        :rtype: str
        """
        return os.path.dirname(self.path)

    def _populate_obj(self):
        """Fully populates object.

        This is used because we do not fully populate a file object when
        instantiating, this is to save calls to Agave. Since some actions only
        require ``system`` and ``path`` then we do not have to waste time in
        fully populating the object. There are some other actions that need
        more information, e.g. :met:`uuid` or :meth:`postit`.

        :return: Self for chainability
        :rtype: :class:`BaseFile`
        """
        if self._links is None:
            res = self._ac.files.list(systemId=self.system,
                                      filePath=urllib.parse.quote(self.path))
            res[0]['name'] = os.path.basename(res[0].path)
            self._wrapped = res[0]
        return self

    # def import_data(self, from_system, from_path, retries=5, remote_url=None, external_resource=False):
    #     """Imports data from an external storage system

    #     :param str from_system: System to import from.
    #     :param str from_path: Path to import from.
    #     :param int retries: Maximum retries if something goes wrong.

    #     :returns: Agave File Resource imported.
    #     :rtype: :class:`BaseFile`

    #     .. note:: This function should be used to move data from one
    #     Agave storage system to another Agave storage system.

    #     .. todo:: We should implement a fallback using another type of
    #     data transfer method if this fails.
    #     """
    #     if not remote_url:
    #         remote_url = 'agave://{}/{}'.format(
    #             from_system,
    #             urllib.parse.quote(from_path)
    #         )
    #     file_name = os.path.split(from_path)[1]
    #     _retries = retries
    #     while _retries > 0:
    #         try:
    #             result = self._ac.files.importData(
    #                 systemId=self.system,
    #                 filePath=urllib.parse.quote(self.path),
    #                 fileName=str(file_name),
    #                 urlToIngest=remote_url
    #             )
    #             async_resp = AgaveAsyncResponse(self._ac, result)
    #             async_status = async_resp.result(600)
    #             _retries = 0
    #         except Error as err:
    #             logger.error(
    #                 'There was an error importing data. %s. Retrying...',
    #                 err,
    #                 exc_info=True
    #             )
    #             _retries -= 1

    #     if str(async_status) == 'FAILED':
    #         logger.error(
    #             'Import Data failed from: systemId=%s, filePath=%s. '
    #             'to: systemId=%s, filePath=%s '
    #             'using URI: %s',
    #             from_system,
    #             from_path,
    #             self.system,
    #             self.path,
    #             remote_url,
    #             exc_info=True
    #         )

    #     # If import is coming from an external resource like google drive,
    #     # don't return a listing for every recursive file upload.
    #     if external_resource:
    #         return BaseFile(system=result['systemId'],
    #                         path=result['path'],
    #                         client=self._ac)
    #     return BaseFile.listing(self._ac, self.system, result['path'])

    def copy(self, dest_path, file_name=None):
        """Copies the current file to the provided destination path.

        If ``new_name`` is *not* provided the file will be copied with the
        same name. If ``dest_path`` is the same as the original and *no*
        ``new_name`` is provided a random string will be appended to the end

        :param str dest_path: Destination path.
        :param str file_name: New name.

        :return: The copied file
        :rtype: :class:`BaseFile`

        .. warning:: If ``dest_path`` does not exists this function will fail.

        .. note:: When returning the response we have to do a :meth:`listing`
        because the response from Agave is not the same a ``listing`` response
        and we need to standardize that.
        """
        if file_name is None:
            file_name = self.name

        body = {'action': 'copy',
                'path': os.path.join(dest_path, file_name)}
        copy_result = self._ac.files.manage(systemId=self.system,
                                            filePath=urllib.parse.quote(self.path),
                                            body=body)
        return BaseFile.listing(self._ac, self.system, copy_result['path'])

    def delete(self):
        """Removes this file from the storage system.

        :returns: True if everything goes ok
        :rtype: bool
        """
        self._ac.files.delete(systemId=self.system,
                              filePath=urllib.parse.quote(self.path))

        return True

    @classmethod
    def ensure_path(cls, client, system, path):
        """Ensure the given path exists in the given storage system.

        This function will return the last response from Agave.
        This means that if four folders are created then only the last folder
        data is returned.

        :param str system: System ID
        :param str path: Path to ensure.

        :return: The last response from agave
        :rtype: dict
        """
        path_comps = path.strip('/').split('/')
        path_indx = 1
        parent = cls(client, system, '/')
        logger.info(path_comps)
        for path_comp in path_comps:
            logger.info(path_comps[:path_indx])
            try:
                ensured = cls.listing(
                    client,
                    system,
                    os.path.join(*path_comps[:path_indx])
                )
            except HTTPError as err:
                if err.response.status_code in [400, 403, 404]:
                    ensured = parent.mkdir(path_comp)
                    parent = ensured
                    path_indx += 1
                else:
                    raise

        return ensured

    def history(self):
        """File History

        :returns: File history
        :rtype: list
        """
        return self._agave.files.getHistory(systemId=self.system,
                                            filePath=urllib.parse.quote(self.path))

    # pylint: disable=too-many-arguments
    @classmethod
    def listing(cls, client, system=settings.AGAVE_STORAGE_SYSTEM,
                path='/', offset=0, limit=100):
        """Lists a file/folder.

        :param client: Agave API client.
        :type client: :class:`agavepy.agave.Agave`.
        :param str system: System Id.
        :param str path: File path.
        :param int offset: Pagination offset.
        :param int limit: Pagination limit.

        :return: File/folder listed.
        :rtype: :class:`BaseFile`

        :raises HTTPError: ``status_code == 403`` if the user does not have,
            at least, read permissions.
        :raises HTTPError: ``status_code == 404`` if the :attr:`path` does
            not exists.

        .. warning:: Agave uses a page size of 100 by default.

        .. warning:: Agave listing response is *always* an array of objects
            with the first object being the file/folder which we are listing.
            This means that on the first page the children are [1:] of the
            response. The rest of the pages are OK.
        """

        list_result = client.files.list(systemId=system,
                                        filePath=urllib.parse.quote(path),
                                        offset=offset,
                                        limit=limit+1)
        if not list_result:
            listing = cls(client=client, system=system, path=path)
            listing._children = []
        else:
            listing = cls(client=client, **list_result[0])
            if listing.type == 'dir' or offset:
                # directory names display as "/" from API
                listing._children = [cls(client=client, **f)
                                    for f in list_result[1:]]

        listing.name = os.path.basename(listing.path)
        return listing

    # pylint: enable=too-many-arguments
    def pems_list(self):
        """Permissions List

        .. todo::
            This needs to be its own class for easier management.

        """
        pems = self._ac.files.listPermissions(systemId=self.system,
                                              filePath=urllib.parse.quote(self.path))
        return pems

    def download(self):
        """Downloads file content.

        :returns: File contents
        :rtype: byte
        :raises ValueError: If trying to download a folder.
        """
        if self.type == 'dir':
            raise ValueError('Cannot download a folder')

        resp = self._ac.files.download(systemId=self.system,
                                       filePath=urllib.parse.quote(self.path))
        return resp.content

    def postit(self, force=True, max_uses=3, lifetime=600):
        """Creates a postit pointing to this file.

        This should be used to preview or quickly share a file.

        :param bool force: Wether to force preview by adding ``inline``
         to the Content-Disposition header.
        :param int max_uses: Maximum amount the postit link can be used.
        :parm int lifetime: Life time of the postit link in seconds.

        :returns: Post it link.
        :rtype: str
        """
        self._populate_obj()
        # pylint: disable=protected-access
        args = {
            'url': urllib.parse.unquote(self._links._self.href),
            'maxUses': max_uses,
            'method': 'GET',
            'lifetime': lifetime,
            'noauth': False
        }
        # pylint: enable=protected-access
        if force:
            args['url'] += '?force=True'

        result = self._ac.postits.create(body=args)
        return result['_links']['self']['href']

    def mkdir(self, dir_name):
        """Create a new directory.

        The directory will be created inside the directory represented by this
        class.

        :param str dir_name: The name of the new directory.

        :return: The newly created directory.
        :rtype: :class:`BaseFile`
        :raises HTTPError: if an error occurs calling the files endpoint.

        .. note:: The response from Agave after creating a diretory is not
            the same returned when listing a file/folder. Because of this we
            return an instance of
        :class:`BaseFile` using only ``systemId`` and ``path``.

        .. todo:: Does this method needs to be a ``@classmethod``?

        """
        body = {
            'action': 'mkdir',
            'path': dir_name
        }
        result = self._ac.files.manage(systemId=self.system,
                                       filePath=urllib.parse.quote(self.path),
                                       body=body)
        return BaseFile(system=result['systemId'],
                        path=result['path'],
                        client=self._ac)

    def move(self, system, dest_path, file_name=None):
        """Move the current file to the given destination.

        If a :attr:`file_name` is given then the file will be renamed upon
        moving it. If :attr:`file_name` is *not* given the file will preserve
        its name.

        :param str des_path: Destination path.
        :param str file_name: New name for file.

        :return: This instance updated.
        :rtype: :class:`BaseFile`

        .. note:: The response from Agave after creating a diretory is not
            the same returned when listing a file/folder. Because of this we
            return an instance of
        :class:`BaseFile` using only ``systemId`` and ``path``.

        """

        if file_name is None:
            file_name = self.name

        body = {'action': 'move',
                'path': os.path.join(dest_path.strip('/'), file_name)}
        move_result = self._ac.files.manage(systemId=system,
                                            filePath=urllib.parse.quote(self.path),
                                            body=body)
        self.path = move_result['path']
        self.name = move_result['name']
        return self

    def rename(self, new_name):
        """Renames file/folder

        This is only a convenience method, we use :meth:`move` since we have
        had some problems using ``agavepy``'s rename action.

        :param str new_name: New name

        :return: The renamed file
        :rtype: :class:`BaseFile`
        """
        return self.move(self.system, os.path.dirname(self.path), new_name)

    def share(self, username, permission, recursive=True):
        """Updates permissions for a given username.

        :param str username: username which permissions will be updated.
        :param str permission: Permission to set. Should be one of:
        READ, WRITE, EXECUTE, READ_WRITE or ALL.
        :param bool recursive: If this permission should be set recursively.

        :return: self for chaining
        :rtype: :class:`BaseFile`

        .. note:: There are more permission values one can set.
        Please refer to :class:`BaseFilePermission` for details.

        .. warning:: Agave does not do any check on the username when setting
         permissions on a file. This means that we can set any permission to a
         user that does not exists.

        """
        body = {'username': username,
                'permission': permission,
                'recursive': recursive}

        self._ac.files.updatePermissions(systemId=self.system,
                                         filePath=urllib.parse.quote(self.path),
                                         body=body)
        return self

    def unshare(self, username):
        """Unshare a file for a given username.

        This is a shortcut method for
        :meth:`BaseFile.share('username', 'NONE')`

        :param str username: username which permissions will be updated.

        :return: self for chaining
        :rtype: :class:`BaseFile`
        """
        return self.share(username, 'NONE')

    def upload(self, upload_file):
        """Upload a file to this directory.

        If the instance of this class is a *directory* the file uploaded will
        be uploaded to this directory. If the instance of this class is a
        *file* then it will be overwritten.

        :param upload_file: File to upload

        :return: uploaded file.
        :rtype: :class:`BaseFile`
        """
        if self.type == 'dir':
            upload_path = self.path
            upload_name = os.path.basename(upload_file.name)
        else:
            upload_path = self.parent_path
            upload_name = self.name
        resp = self._ac.files.importData(systemId=self.system,
                                         filePath=urllib.parse.quote(upload_path),
                                         fileName=str(upload_name),
                                         fileToUpload=upload_file)
        return BaseFile(client=self._ac,
                        system=resp['systemId'],
                        path=resp['path'])
