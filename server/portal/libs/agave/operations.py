import urllib
import os
import io
from django.conf import settings
from requests.exceptions import HTTPError
import logging
from elasticsearch_dsl import Q
from portal.libs.elasticsearch.indexes import IndexedFile
from portal.apps.search.tasks import agave_indexer, agave_listing_indexer
from portal.exceptions.api import ApiException
from portal.libs.agave.utils import text_preview, get_file_size, increment_file_name
from portal.libs.agave.filter_mapping import filter_mapping

logger = logging.getLogger(__name__)


def listing(client, system, path, offset=0, limit=100, *args, **kwargs):
    """
    Perform a Tapis file listing

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    system: str
        Tapis system ID.
    path: str
        Path in which to peform the listing.
    offset: int
        Offset for pagination.
    limit: int
        Number of results to return.

    Returns
    -------
    list
        List of dicts containing file metadata from Elasticsearch

    """
    raw_listing = client.files.list(systemId=system,
                                    filePath=urllib.parse.quote(path),
                                    offset=int(offset) + 1,
                                    limit=int(limit))

    try:
        # Convert file objects to dicts for serialization.
        listing = list(map(dict, raw_listing))
    except IndexError:
        # Return [] if the listing is empty.
        listing = []

    # Update Elasticsearch after each listing.
    agave_listing_indexer.delay(listing)
    return {'listing': listing, 'reachedEnd': len(listing) < int(limit)}


def iterate_listing(client, system, path, limit=100):
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
        page = listing(client, system, path, offset, limit)['listing']
        yield from page
        offset += limit
        if len(page) != limit:
            # Break out of the loop if the listing is exhausted.
            break


def search(client, system, path='', offset=0, limit=100, query_string='', filter=None, **kwargs):
    """
    Perform a search for files using a query string.

    Params
    ------
    client: NoneType
    system: str
        Tapis system ID to filter on.
    path: NoneType
    offset: int
        Search offset for pagination.
    limit: int
        Number of search results to return
    query_string: str
        Query string to pass to Elasticsearch

    Returns
    -------
    list
        List of dicts containing file metadata from Elasticsearch

    """
    if filter == 'Folders':
        filter_query = Q('term', **{'format': 'folder'})
    else:
        filter_extensions = filter_mapping.get(filter, [])
        filter_query = Q('terms', **{'name._pattern': filter_extensions})

    ngram_query = Q("query_string", query=query_string,
                    fields=["name"],
                    minimum_should_match='100%',
                    default_operator='or')
    match_query = Q("query_string", query=query_string,
                    fields=[
                        "name._exact, name._pattern"],
                    default_operator='and')

    search = IndexedFile.search()
    if query_string:
        search = search.query(ngram_query | match_query)
    else:
        # search without a query should just filter current path
        search = search.sort('name._exact')
        search = search.filter('term', **{'basePath._exact': '/' + path.strip('/')})
    if filter:
        search = search.filter(filter_query)

    search = search.filter('term', **{'system._exact': system})
    search = search.extra(from_=int(offset), size=int(limit))
    res = search.execute()
    hits = [hit.to_dict() for hit in res]

    return {'listing': hits, 'count': res.hits.total.value,
            'reachedEnd': len(hits) < int(limit)}


def download(client, system, path, href, force=True, max_uses=3, lifetime=600, **kwargs):
    """Creates a postit pointing to this file.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: NoneType
    path: NoneType
    href: str
        Tapis href to use for generating the postit.
    force: bool
        Wether to force preview by adding ``inline``
    max_uses: int
         Maximum amount the postit link can be used.
    lifetime: int
        Life time of the postit link in seconds.

    Returns
    -------
    str
    Post it link.
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

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    system: str
        Tapis system ID.
    path: str
        Path in which to run mkdir.
    dir_name: str
        Name of the directory

    Returns
    -------
    dict
    """
    body = {
        'action': 'mkdir',
        'path': dir_name
    }
    result = client.files.manage(systemId=system,
                                 filePath=urllib.parse.quote(path),
                                 body=body)

    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': path,
                                      'recurse': False})
    return result


def move(client, src_system, src_path, dest_system, dest_path, file_name=None):
    """Move a current file to the given destination.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    src_system: str
        System ID for the file's source.
    src_path: str
        Path to the source file.
    dest_system: str
        System ID for the destination.
    dest_path: str
        Path under which the file should be moved.
    file_name: str
        New name for the file if desired.

    Returns
    -------
    dict

    """
    if src_system != dest_system:
        raise ApiException("Cross-system file moves are not supported")

    if file_name is None:
        file_name = src_path.strip('/').split('/')[-1]

    dest_path_full = os.path.join(dest_path.strip('/'), file_name)
    src_path_full = urllib.parse.quote(src_path)

    # Handle attempt to move a file into its current path.
    if src_system == dest_system and src_path_full == dest_path_full:
        return {'system': src_system, 'path': src_path_full, 'name': file_name}

    try:
        # list the directory and check if file_name exists
        file_listing = client.files.list(systemId=dest_system, filePath=dest_path)
        file_name = increment_file_name(listing=file_listing, file_name=file_name)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    full_dest_path = os.path.join(dest_path.strip('/'), file_name)

    if src_system == dest_system:
        body = {'action': 'move',
                'path': full_dest_path}
        move_result = client.files.manage(systemId=src_system,
                                          filePath=urllib.parse.quote(
                                              src_path),
                                          body=body)

    if os.path.dirname(src_path) != dest_path or src_path != dest_path:
        agave_indexer.apply_async(kwargs={'systemId': src_system,
                                          'filePath': os.path.dirname(src_path),
                                          'recurse': False},
                                  routing_key='indexing')
    agave_indexer.apply_async(kwargs={'systemId': dest_system,
                                      'filePath': os.path.dirname(full_dest_path),
                                      'recurse': False}, routing_key='indexing')
    if move_result['nativeFormat'] == 'dir':
        agave_indexer.apply_async(kwargs={'systemId': dest_system,
                                          'filePath': full_dest_path, 'recurse': True},
                                  routing_key='indexing')
    return move_result


def copy(client, src_system, src_path, dest_system, dest_path, file_name=None,
         *args, **kwargs):
    """Copies the current file to the provided destination path.

     Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use for the listing.
    src_system: str
        System ID for the file's source.
    src_path: str
        Path to the source file.
    dest_system: str
        System ID for the destination.
    dest_path: str
        Path under which the file should be copied.
    file_name: str
        New name for the file if desired.

    Returns
    -------
    dict
    """
    if file_name is None:
        file_name = src_path.strip('/').split('/')[-1]

    try:
        # list the directory and check if file_name exists
        file_listing = client.files.list(systemId=dest_system, filePath=dest_path)
        file_name = increment_file_name(listing=file_listing, file_name=file_name)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    full_dest_path = os.path.join(dest_path.strip('/'), file_name)
    if src_system == dest_system:
        body = {'action': 'copy',
                'path': full_dest_path}
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

    agave_indexer.apply_async(kwargs={'systemId': dest_system,
                                      'filePath': os.path.dirname(full_dest_path),
                                      'recurse': False},
                              routing_key='indexing')
    agave_indexer.apply_async(kwargs={'systemId': dest_system,
                                      'filePath': full_dest_path,
                                      'recurse': True},
                              routing_key='indexing')

    return copy_result


def makepublic(client, src_system, src_path, dest_path='/', *args, **kwargs):
    dest_system = next((sys['system']
                        for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
                        if sys['scheme'] == 'public'))

    return copy(client,
                src_system,
                src_path,
                dest_system,
                dest_path,
                *args, **kwargs)


def delete(client, system, path):
    return client.files.delete(systemId=system,
                               filePath=urllib.parse.quote(path))


def rename(client, system, path, new_name):
    """Renames a file. This is performed under the hood by moving the file to
    the same parent folder but with a new name.

     Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID for the file.
    path: str
        Path of the file relative to the storage system root.
    new_name: str
        New name for the file.

    Returns
    -------
    dict
    """
    new_path = os.path.dirname(path)
    return move(client, src_system=system, src_path=path,
                dest_system=system, dest_path=new_path, file_name=new_name)


def trash(client, system, path):
    """Move a file to the .Trash folder.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID for the file.
    path: str
        Path of the file relative to the storage system root.

    Returns
    -------
    dict
    """

    file_name = path.strip('/').split('/')[-1]

    # Create a .Trash path if none exists
    try:
        client.files.list(systemId=system,
                          filePath=settings.AGAVE_DEFAULT_TRASH_NAME)
    except HTTPError as err:
        if err.response.status_code != 404:
            logger.error("Unexpected exception listing .trash path in {}".format(system))
            raise
        mkdir(client, system, '/', settings.AGAVE_DEFAULT_TRASH_NAME)

    resp = move(client, system, path, system,
                settings.AGAVE_DEFAULT_TRASH_NAME, file_name)

    return resp


def upload(client, system, path, uploaded_file):
    """Upload a file.
    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID for the file.
    path: str
        Path to upload the file to.
    uploaded_file: file
        File object to upload.

    Returns
    -------
    dict
    """
    try:
        file_listing = client.files.list(systemId=system, filePath=path)
        uploaded_file.name = increment_file_name(listing=file_listing, file_name=uploaded_file.name)
    except HTTPError as err:
        if err.response.status_code != 404:
            raise

    # the fileName param does not seem to accept a different file name
    resp = client.files.importData(systemId=system,
                                   filePath=urllib.parse.quote(path),
                                   fileToUpload=uploaded_file)

    agave_indexer.apply_async(kwargs={'systemId': system,
                                      'filePath': path,
                                      'recurse': False},
                              )
    return dict(resp)


def preview(client, system, path, href, max_uses=3, lifetime=600, **kwargs):
    """Preview a file.
    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID.
    path: str
        Path to the file.
    href: str
        Tapis href for the file to be previewed.
    max_uses: int
         Maximum amount the postit link can be used.
    lifetime: int
        Life time of the postit link in seconds.

    Returns
    -------
    dict
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
    txt = None
    error = None
    file_type = None
    if file_ext in settings.SUPPORTED_TEXT_PREVIEW_EXTS:
        file_type = 'text'
    elif file_ext in settings.SUPPORTED_IMAGE_PREVIEW_EXTS:
        file_type = 'image'
    elif any([ext for ext in settings.SUPPORTED_BRAINMAP_PREVIEW_EXTS if file_name.endswith(ext)]):
        file_type = 'brainmap'
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
    elif file_ext in settings.SUPPORTED_NEW_WINDOW_PREVIEW_EXTS:
        error = "This file type must be previewed in a new window."
    else:
        file_type = 'other'

    if file_type in ['other', 'text']:
        if get_file_size(client, system, path) < 5000000:
            try:
                txt = text_preview(url)
            except ValueError:
                # unable to get text content
                error = "Unable to show preview."
        else:
            error = "File too large to preview in this window."
    return {'href': url, 'fileType': file_type, 'content': txt, 'error': error}


def download_bytes(client, system, path):
    """Returns a BytesIO object representing the file.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
    path: str
    Returns
    -------
    io.BytesIO
        BytesIO object representing the downloaded file.
    """
    file_name = os.path.basename(path)
    resp = client.files.download(systemId=system, filePath=path)
    result = io.BytesIO(resp.content)
    result.name = file_name
    return result
