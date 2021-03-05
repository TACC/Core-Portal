"""Utilities to help on agave/models implementations.

.. module:: portal.libs.agave.utils
"""
import logging
import os
import urllib.request
import urllib.parse
import urllib.error
from django.conf import settings
from agavepy.agave import Agave
import requests

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


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


def walk(client, system, path, bottom_up=False, yield_base=True):
    """Walk a path in an Agave storage system.

    This generator will yield single
    :class:`~portal.libs.agave.models.files.BaseFile` object each iteration.
    A call to ``files.list`` is done for every sub level of
    :attr:`path`. For a level approach see :func:`walk_levels`

    :param str system: system id.
    :param str path: path to walk.
    :param bool bottom_up: if ``True`` walk the path bottom to top.
    :param bool yield_base: if ``True`` will yield a
        :class:`~portal.libs.agave.models.files.BaseFile` object representing
        :attr:`path`

    :returns: childrens of the given file path
    :rtype: :class:`~portal.libs.agave.models.files.BaseFile`

    .. rubric:: Rationale

    Although walking a farily complicated folder tree purely in Agave calls
    might seem inefficient, in some project we will not have direct access to
    the different file systems. This function works almost like :func:`os.walk`
    instead of returning the listing by levels it returns each one of the files
    wrapped in a handy class.

    .. warning:

    In order to reduce latency the returned
    :class:`~portal.libs.agave.models.files.BaseFile` object is constructed
    from the `agave.files.list` response. This means that some values might be
    missing. As of Jun/2017 the ``uuid`` is missing from this. To mitigate this
    we delete the ``_links`` object, that way if the ``uuid`` attribute is
    accessed, the entire object will be correctly populated.

    .. seealso::

        Class :mod:`portal.libs.agave.models.files.BaseFile`

    """
    from portal.libs.agave.models.files import BaseFile
    files = client.files.list(systemId=system,
                              filePath=urllib.parse.quote(path))
    for json_file in files:
        json_file.pop('_links', None)
        if json_file['name'] == '.':
            if not yield_base:
                continue
        _file = BaseFile(client, **json_file)
        _file.name = os.path.basename(_file.path)
        if not bottom_up:
            yield _file
        if _file.format == 'folder' and json_file['name'] != ".":
            for child in walk(
                    client,
                    system,
                    _file.path,
                    bottom_up=bottom_up,
                    yield_base=False
            ):
                yield child
        if bottom_up:
            yield _file


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
        page = client.files.list(systemId=system,
                                 filePath=urllib.parse.quote(path),
                                 offset=offset,
                                 limit=limit)
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
    """Return an agave instance with the admin account."""
    return Agave(
        api_server=settings.AGAVE_TENANT_BASEURL,
        token=settings.AGAVE_SUPER_TOKEN)


def text_preview(url):
    """Generate a text preview content
    Args:
    ------
        url (str): postit url from Agave
    Returns:
    ------
        str: text content to preview.
    Raises:
        ValueError if there are non-ascii characters
    """
    try:
        resp = requests.get(url)
        if (resp.encoding.lower() == 'utf-8'):
            content = resp.text
            # Raises UnicodeDecodeError for files with non-ascii characters
            content.encode('ascii', 'strict')
            return content
        else:
            raise ValueError("File does not contain text")
    except UnicodeDecodeError as e:
        logger.debug("Unable to decode file/contains non-ascii characters")
        raise ValueError("File does not contain text")


def increment_file_name(listing, file_name):
    if any(x['name'] for x in listing if x['name'] == file_name):
        inc = 1
        _ext = os.path.splitext(file_name)[1]
        _name = os.path.splitext(file_name)[0]
        _inc = "({})".format(inc)
        file_name = '{}{}{}'.format(_name, _inc, _ext)

        while any(x['name'] for x in listing if x['name'] == file_name):
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
    file_response = client.files.list(systemId=system,
                                      filePath=urllib.parse.quote(path))
    return int(file_response[0]["length"])
