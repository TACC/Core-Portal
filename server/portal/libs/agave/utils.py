"""Utilities to help on agave/models implementations.

.. module:: portal.libs.agave.utils
"""
import logging
import os
from django.conf import settings
from tapipy.tapis import Tapis
import requests

logger = logging.getLogger(__name__)


def to_camel_case(input_str):
    """Convert from snake_case to lowerCamelCase.

    This should be mainly used to translate between
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
    camel_case = ''.join(
        ['_' * left_cnt,
         comps[0],
         right_side,
         '_' * right_cnt]
    )
    return camel_case


def iterate_level(client, system, path, limit=100):
    """Iterate over a filesystem level yielding an attrdict for each file/folder
        on the level.
        :param str client: an Agave client
        :param str system: system
        :param str path: path to walk
        :param int limit: Number of docs to retrieve per API call

        :rtype agavepy.agave.AttrDict
    """
    offset = 0

    while True:
        _page = client.files.listFiles(systemId=system,
                                       path=path,
                                       offset=int(offset),
                                       limit=int(limit))
        page = list(map(lambda f: {
            'system': system,
            'type': 'dir' if f.type == 'dir' else 'file',
            'format': 'folder' if f.type == 'dir' else 'raw',
            'mimeType': f.mimeType,
            'path': f.path,
            'name': f.name,
            'length': f.size,
            'lastModified': f.lastModified,
            '_links': {
                'self': {'href': f.url}
            }}, _page))
        yield from page
        offset += limit
        if len(page) != limit:
            # Break out of the loop if the listing is exhausted.
            break


# pylint: disable=too-many-locals
def walk_levels(client, system, path, bottom_up=False, ignore_hidden=False):
    """Walk a pth in an Agave storgae system.

    This generator will walk an agave storage system and return a tuple with
    the root path, a list of folder and a list of files. This function is more
    like :func:`os.walk` than :func:`walk`.

    :param str system: system
    :param str path: path to walk
    :param bool bottom_up:if ``True`` walk the path bottom to top.

    :returns: (<str root_path>, [<``BaseFile`` folders>],
        [<``BaseFile`` files>])
    :rtype: tuple

    .. note::
        Similar to :func:`os.walk` the ``files`` and ``folders`` list can be
        modified inplace to modify future iterations. Modifying the ``files``
        and ``folders`` lists inplace can be used to tell the genrator of any
        modifications done with every iterations.

    :Example:
    >>> #Walk a specific number of levels
    >>> levels = 2
    >>> for root, folders, files in walk_levels('system.id','home_dir/path'):
    >>>     #do cool things
    >>>     #first check if we are at the necessary level
    >>>     if levels and len(root.split('/')) >= levels:
    ...         #delte everything from the folders list
    ...         del folders[:]

    """

    folders = []
    files = []
    for agave_file in iterate_level(client, system, path):
        if agave_file['name'] == '.':
            continue
        if ignore_hidden and agave_file['name'][0] == '.':
            continue
        if agave_file['format'] == 'folder':
            folders.append(agave_file)
        else:
            files.append(agave_file)
    if not bottom_up:
        yield (path, folders, files)
    for child in folders:
        for (
                child_path,
                child_folders,
                child_files
        ) in walk_levels(
            client,
            system,
            child['path'],
            bottom_up=bottom_up
        ):
            yield (child_path, child_folders, child_files)

    if bottom_up:
        yield (path, folders, files)


def service_account():
    """Return a Tapis instance with the admin account."""
    return Tapis(
        base_url=settings.TAPIS_TENANT_BASEURL,
        access_token=settings.TAPIS_ADMIN_JWT)


def user_account(access_token):
    """Return a Tapis instance with the user credentials"""
    return Tapis(base_url=getattr(settings, 'TAPIS_TENANT_BASEURL'),
                 client_id=getattr(settings, 'TAPIS_CLIENT_ID'),
                 client_key=getattr(settings, 'TAPIS_CLIENT_KEY'),
                 access_token=access_token)


def text_preview(url):
    """Generate a text preview content
    Args:
    ------
        url (str): postit url from Tapis
    Returns:
    ------
        str: text content to preview.
    Raises:
        ValueError if there are non-ascii characters
    """
    try:
        resp = requests.get(url)
        if (resp.encoding is not None and resp.encoding.lower() == 'utf-8'):
            content = resp.text
            # Raises UnicodeDecodeError for files with non-ascii characters
            content.encode('ascii', 'strict')
            return content
        else:
            raise ValueError("File does not contain text")
    except UnicodeDecodeError:
        logger.debug("Unable to decode file/contains non-ascii characters")
        raise ValueError("File does not contain text")


def increment_file_name(listing, file_name):
    if any(x.name for x in listing if x.name == file_name):
        inc = 1
        _ext = os.path.splitext(file_name)[1]
        _name = os.path.splitext(file_name)[0]
        _inc = "({})".format(inc)
        file_name = '{}{}{}'.format(_name, _inc, _ext)

        while any(x.name for x in listing if x.name == file_name):
            inc += 1
            _inc = "({})".format(inc)
            file_name = '{}{}{}'.format(_name, _inc, _ext)
    return file_name


def get_file_size(client, system, path):
    """ Get file size
    :param client: an Agave client
    :param system: system of file
    :param path: path of file
    :return: file size in bytes
    """
    file_response = client.files.listFiles(systemId=system,
                                           path=path)
    return int(file_response[0].size)
