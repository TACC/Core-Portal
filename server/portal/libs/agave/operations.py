import urllib
import os
import datetime
from django.conf import settings
from requests.exceptions import HTTPError
import logging

logger = logging.getLogger(__name__)


def listing(client, system, path, offset=0, limit=100):
    raw_listing = client.files.list(systemId=system,
                                    filePath=urllib.parse.quote(path),
                                    offset=int(offset) + 1,
                                    limit=int(limit))

    try:
        listing = list(map(dict, raw_listing))
    except IndexError:
        listing = []
    return {'listing': listing, 'reachedEnd': len(listing) < int(limit)}


def download(client, system, path, href, force=True, max_uses=3, lifetime=600):
    """Creates a postit pointing to this file.

    This should be used to preview or quickly share a file.

    :param bool force: Wether to force preview by adding ``inline``
     to the Content-Disposition header.
    :param int max_uses: Maximum amount the postit link can be used.
    :parm int lifetime: Life time of the postit link in seconds.

    :returns: Post it link.
    :rtype: str
    """
    # pylint: disable=protected-access
    args = {
        'url': urllib.parse.unquote(href),
        'maxUses': max_uses,
        'method': 'GET',
        'lifetime': lifetime,
        'noauth': False
    }
    # pylint: enable=protected-access
    if force:
        args['url'] += '?force=True'

    result = client.postits.create(body=args)
    return result['_links']['self']['href']


def mkdir(client, system, path, dir_name):
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
    result = client.files.manage(systemId=system,
                                 filePath=urllib.parse.quote(path),
                                 body=body)
    return result


def move(client, src_system, src_path, dest_system, dest_path, file_name=None):
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
        file_name = src_path.strip('/').split('/')[-1]

    dest_path_full = os.path.join(dest_path.strip('/'), file_name)
    src_path_full = urllib.parse.quote(src_path)

    # Handle attempt to move a file into its current path.
    if src_system == dest_system and src_path_full == dest_path_full:
        return {'system': src_system, 'path': src_path_full, 'name': file_name}

    try:
        client.files.list(systemId=dest_system,
                          filePath="{}/{}".format(dest_path, file_name))

        # Destination path exists, must make it unique.
        _ext = os.path.splitext(file_name)[1].lower()
        _name = os.path.splitext(file_name)[0]
        now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H-%M-%S')
        file_name = '{}_{}{}'.format(_name, now, _ext)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    if src_system == dest_system:
        body = {'action': 'move',
                'path': os.path.join(dest_path.strip('/'), file_name)}
        move_result = client.files.manage(systemId=src_system,
                                          filePath=urllib.parse.quote(
                                              src_path),
                                          body=body)
    else:
        src_url = 'agave://{}/{}'.format(
            src_system,
            urllib.parse.quote(src_path)
        )
        move_result = client.files.importData(
            systemId=dest_system,
            filePath=urllib.parse.quote(dest_path),
            fileName=str(file_name),
            urlToIngest=src_url
        )
        client.files.delete(systemId=src_system,
                            filePath=urllib.parse.quote(src_path))

    return move_result


def copy(client, src_system, src_path, dest_system, dest_path, file_name=None):
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
        file_name = src_path.strip('/').split('/')[-1]

    try:
        client.files.list(systemId=dest_system,
                          filePath="{}/{}".format(dest_path, file_name))

        # Trash path exists, must make it unique.
        _ext = os.path.splitext(file_name)[1].lower()
        _name = os.path.splitext(file_name)[0]
        now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H-%M-%S')
        file_name = '{}_{}{}'.format(_name, now, _ext)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    if src_system == dest_system:
        body = {'action': 'copy',
                'path': os.path.join(dest_path.strip('/'), file_name)}
        copy_result = client.files.manage(systemId=src_system,
                                          filePath=urllib.parse.quote(
                                              src_path),
                                          body=body)
    else:
        src_url = 'agave://{}/{}'.format(
            src_system,
            urllib.parse.quote(src_path)
        )
        copy_result = client.files.importData(
            systemId=dest_system,
            filePath=urllib.parse.quote(dest_path),
            fileName=str(file_name),
            urlToIngest=src_url
        )

    return copy_result


def delete(client, system, path):
    return client.files.delete(systemId=system,
                               filePath=urllib.parse.quote(path))


def rename(client, system, path, new_name):
    new_path = os.path.dirname(path)
    return move(client, src_system=system, src_path=path,
                dest_system=system, dest_path=new_path, file_name=new_name)


def trash(client, system, path):

    file_name = path.strip('/').split('/')[-1]
    trash_name = file_name

    # Create a trash path if none exists
    try:
        client.files.list(systemId=system,
                          filePath=settings.AGAVE_DEFAULT_TRASH_NAME)
    except HTTPError:
        mkdir(client, system, '/', settings.AGAVE_DEFAULT_TRASH_NAME)

    try:
        client.files.list(systemId=system,
                          filePath=os.path.join(settings.AGAVE_DEFAULT_TRASH_NAME,
                                                file_name))
        # Trash path exists, must make it unique.
        _ext = os.path.splitext(file_name)[1].lower()
        _name = os.path.splitext(file_name)[0]
        now = datetime.datetime.utcnow().strftime('%Y-%m-%d %H-%M-%S')
        trash_name = '{}_{}{}'.format(_name, now, _ext)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    resp = move(client, system, path, system,
                settings.AGAVE_DEFAULT_TRASH_NAME, trash_name)

    return resp


def upload(client, system, path, uploaded_file, ensure_path=False,
           **kwargs):
    """Upload one or more files.

    :param str file_id_dest: Id representing a file/folder.
    :param list uploaded_files: List of uploaded files.
    :param bool ensure_path: If True the path of the uploaded
        files will be created if it does not exists.

    :returns: A file object.
    :rtype: obj
    """

    try:
        listing(client, system=system, path=path)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    upload_name = os.path.basename(uploaded_file.name)

    resp = client.files.importData(systemId=system,
                                   filePath=urllib.parse.quote(path),
                                   fileName=str(upload_name),
                                   fileToUpload=uploaded_file)

    return resp


def preview(client, system, path, href, max_uses=3, lifetime=600):
    """Preview a file.

    :param str file_id: Id representing a file/folder.

    :returns: Downloaded file stream.
    :rtype: byte[]

    """

    file_name = path.strip('/').split('/')[-1]
    file_ext = os.path.splitext(file_name)[1].lower()

    args = {
        'url': urllib.parse.unquote(href),
        'maxUses': max_uses,
        'method': 'GET',
        'lifetime': lifetime,
        'noauth': False
    }

    result = client.postits.create(body=args)
    url = result['_links']['self']['href']

    if file_ext in settings.SUPPORTED_TEXT_PREVIEW_EXTS:
        file_type = 'text'
    elif file_ext in settings.SUPPORTED_IMAGE_PREVIEW_EXTS:
        file_type = 'image'
    elif file_ext in settings.SUPPORTED_OBJECT_PREVIEW_EXTS:
        file_type = 'object'
    elif file_ext in settings.SUPPORTED_MS_OFFICE:
        file_type = 'ms-office'
        url = 'https://view.officeapps.live.com/op/view.aspx?src={}'.\
            format(url)
    elif file_ext in settings.SUPPORTED_IPYNB_PREVIEW_EXTS:
        file_type = 'ipynb'
        tmp = url.replace('https://', '')
        url = 'https://nbviewer.jupyter.org/urls/{tmp}'.format(tmp=tmp)
    else:
        file_type = 'other'

    return {'href': url, 'fileType': file_type}
