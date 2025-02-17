import os
import io
from django.conf import settings
import logging
from elasticsearch_dsl import Q
from portal.libs.elasticsearch.indexes import IndexedFile
from portal.apps.search.tasks import tapis_indexer, tapis_listing_indexer
from portal.exceptions.api import ApiException
from portal.libs.agave.utils import text_preview, get_file_size, increment_file_name
from portal.libs.agave.filter_mapping import filter_mapping
from pathlib import Path
from tapipy.errors import BaseTapyException

logger = logging.getLogger(__name__)


def listing(client, system, path, offset=0, limit=100, *args, **kwargs):
    """
    Perform a Tapis file listing

    Params
    ------
    client: tapipy.tapis.Tapis
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
    raw_listing = client.files.listFiles(systemId=system,
                                         path=path,
                                         offset=int(offset),
                                         limit=int(limit),
                                         headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

    try:
        # Convert file objects to dicts for serialization.
        listing = list(map(lambda f: {
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
            }}, raw_listing))
    except IndexError:
        # Return [] if the listing is empty.
        listing = []

    # Update Elasticsearch after each listing.
    tapis_listing_indexer.delay(listing)
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
    client: tapipy.tapis.Tapis
        Tapis client to use for the listing.
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

    # Perform a listing to ensure the user has access to the directory they're searching
    listing(client, system, path)

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
        search = search.filter('term', **{'basePath._exact': path.strip('/')})
    if filter:
        search = search.filter(filter_query)

    search = search.filter('prefix', **{'path._exact': path.strip('/')})
    search = search.filter('term', **{'system._exact': system})
    search = search.extra(from_=int(offset), size=int(limit))
    res = search.execute()
    hits = [hit.to_dict() for hit in res]

    return {'listing': hits, 'count': res.hits.total.value,
            'reachedEnd': len(hits) < int(limit)}


def download(client, system, path, max_uses=3, lifetime=600, **kwargs):
    """Creates a postit pointing to this file.

    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: NoneType
    path: NoneType
    max_uses: int
         Maximum amount the postit link can be used.
    lifetime: int
        Life time of the postit link in seconds.

    Returns
    -------
    str
    Post it link.
    """

    create_postit_result = client.files.createPostIt(systemId=system, path=path, allowedUses=max_uses, validSeconds=lifetime)

    redeemUrl = f'{create_postit_result.redeemUrl}?download=true'

    return redeemUrl


def mkdir(client, system, path, dir_name, **kwargs):
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

    path_input = str(Path(path) / Path(dir_name))
    client.files.mkdir(systemId=system, path=path_input)

    tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                      'systemId': system,
                                      'filePath': path,
                                      'recurse': False},
                              )

    return {"result": "OK"}


def move(client, src_system, src_path, dest_system, dest_path, file_name=None, **kwargs):
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

    # Handle attempt to move a file into its current path.
    if src_system == dest_system and src_path == dest_path_full:
        return {'system': src_system, 'path': src_path, 'name': file_name}

    # list the directory and check if file_name exists
    file_listing = client.files.listFiles(systemId=dest_system, path=dest_path)
    file_name = increment_file_name(listing=file_listing, file_name=file_name)
    dest_path_full = os.path.join(dest_path.strip('/'), file_name)

    if src_system == dest_system:
        move_result = client.files.moveCopy(systemId=src_system,
                                            path=src_path,
                                            operation="MOVE",
                                            newPath=dest_path_full,
                                            headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

    if os.path.dirname(src_path) != dest_path or src_path != dest_path:
        tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                          'systemId': src_system,
                                          'filePath': os.path.dirname(src_path),
                                          'recurse': False},
                                  routing_key='indexing'
                                  )

    tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                      'systemId': dest_system,
                                      'filePath': os.path.dirname(dest_path_full),
                                      'recurse': False},
                              routing_key='indexing'
                              )

    # get information about file to check if it is a dir or not
    file_info = client.files.getStatInfo(systemId=dest_system, path=dest_path_full)

    if (file_info.dir):
        tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                          'systemId': dest_system,
                                          'filePath': dest_path_full,
                                          'recurse': True},
                                  routing_key='indexing'
                                  )

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

    # list the directory and check if file_name exists
    file_listing = client.files.listFiles(systemId=dest_system, path=dest_path)
    file_name = increment_file_name(listing=file_listing, file_name=file_name)

    dest_path_full = os.path.join(dest_path.strip('/'), file_name)

    if src_system == dest_system:
        copy_result = client.files.moveCopy(systemId=src_system,
                                            path=src_path,
                                            operation="COPY",
                                            newPath=dest_path_full,
                                            headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    else:

        src_url = f'tapis://{src_system}/{src_path}'
        dest_url = f'tapis://{dest_system}/{dest_path_full}'

        copy_response = client.files.createTransferTask(elements=[{
            'sourceURI': src_url,
            'destinationURI': dest_url
        }], headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

        copy_result = {
            'uuid': copy_response.uuid,
            'status': copy_response.status,
        }

    tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                      'systemId': dest_system,
                                      'filePath': os.path.dirname(dest_path_full),
                                      'recurse': False},
                              routing_key='indexing'
                              )

    tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                      'systemId': dest_system,
                                      'filePath': dest_path_full,
                                      'recurse': True},
                              routing_key='indexing'
                              )

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


def delete(client, system, path, *args, **kwargs):
    return client.files.delete(systemId=system,
                               path=path,
                               headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})


def rename(client, system, path, new_name, *args, **kwargs):
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
                dest_system=system, dest_path=new_path, file_name=new_name, **kwargs)


def trash(client, system, path, homeDir, *args, **kwargs):
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
        client.files.listFiles(systemId=system,
                               path=f'{homeDir}/{settings.TAPIS_DEFAULT_TRASH_NAME}')
    except BaseTapyException as err:
        if err.response.status_code != 404:
            logger.error(f'Unexpected exception listing .trash path in {system}')
            raise
        mkdir(client, system, homeDir, settings.TAPIS_DEFAULT_TRASH_NAME)

    resp = move(client, system, path, system,
                f'{homeDir}/{settings.TAPIS_DEFAULT_TRASH_NAME}', file_name, **kwargs)

    return resp


def upload(client, system, path, uploaded_file, *args, **kwargs):
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
    file_listing = client.files.listFiles(systemId=system, path=path)
    uploaded_file.name = increment_file_name(listing=file_listing, file_name=uploaded_file.name)

    dest_path = os.path.join(path.strip('/'), uploaded_file.name)
    response_json = client.files.insert(systemId=system,
                                        path=dest_path,
                                        file=uploaded_file,
                                        headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})
    tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                      'systemId': system,
                                      'filePath': path,
                                      'recurse': False},
                              )

    return response_json


def preview(client, system, path, max_uses=3, lifetime=600, **kwargs):
    """Preview a file.
    Params
    ------
    client: agavepy.agave.Agave
        Tapis client to use.
    system: str
        Tapis system ID.
    path: str
        Path to the file.
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

    postit = client.files.createPostIt(systemId=system,
                                       path=path, allowedUses=max_uses,
                                       validSeconds=lifetime,
                                       headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

    url = postit.redeemUrl
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


def download_bytes(client, system, path, *args, **kwargs):
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
    resp = client.files.getContents(systemId=system, path=path)
    result = io.BytesIO(resp)
    result.name = file_name
    return result
