import base64
import os
import io
from django.conf import settings
from django.db import transaction
import logging
from elasticsearch_dsl import Q
from portal.libs.elasticsearch.indexes import IndexedFile
from portal.apps.search.tasks import tapis_indexer, tapis_listing_indexer
from portal.exceptions.api import ApiException
from portal.libs.agave.utils import text_preview, get_file_size, increment_file_name
from portal.libs.agave.filter_mapping import filter_mapping
from pathlib import Path
from portal.apps._custom.drp.models import FileObj
from portal.apps.projects.tasks import process_file
from tapipy.errors import BaseTapyException
from portal.apps.projects.models.metadata import ProjectsMetadata
from portal.apps.datafiles.models import DataFilesMetadata
from portal.apps import SCHEMA_MAPPING
from portal.apps.projects.workspace_operations.project_meta_operations import (add_file_associations, create_entity_metadata, create_file_obj, get_entity, get_file_obj, get_ordered_value, get_value, patch_entity_and_node, 
                                                                               patch_file_association)
from portal.apps._custom.drp import constants
from portal.apps.projects.workspace_operations.graph_operations import add_node_to_project, get_root_node, get_node_from_path, update_node_in_project


logger = logging.getLogger(__name__)


def get_datafile_metadata(system, path):
    try: 
        datafile_metadata = DataFilesMetadata.objects.get(path=f'{system}/{path.strip("/")}')
        return datafile_metadata.ordered_metadata
    except: 
        return None

@transaction.atomic
def update_datafile_metadata(system, name, old_path, new_path, metadata):
    
    validated_metadata = validate_datafile_metadata({**metadata, 'name': name})

    files_metadata = DataFilesMetadata.objects.get(path=f'{system}/{old_path.strip("/")}')
    files_metadata.name = name
    files_metadata.path = f"{system}/{new_path.strip('/')}" 
    files_metadata.metadata = validated_metadata
    files_metadata.save()

    for child in DataFilesMetadata.objects.filter(parent=files_metadata.id):
        update_datafile_metadata(system=system, name=child.name, old_path=child.path.split('/', 1)[1], new_path=f"{new_path}/{child.name}", metadata=child.metadata)

@transaction.atomic
def create_datafile_metadata(system, path, name, metadata):

    project_instance = ProjectsMetadata.objects.get(project_id=system)

    validated_metadata = validate_datafile_metadata(metadata)

    files_metadata = DataFilesMetadata(
        name = name,
        path = path,
        metadata = validated_metadata,
        project = project_instance
    )

    files_metadata.save()
    print(f'File Metadata for path {path} saved successfully')


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
        
    folder_entity_value = get_value(system, path)

    try:
        # Convert file objects to dicts for serialization.
        listing = []

        for f in raw_listing: 
            if f.type == 'dir':
                value = get_value(system,f.path)
                entity = get_entity(system, f.path)
                uuid = entity.to_dict().get('uuid') if entity else None
            else: 
                file_obj = get_file_obj(system, f.path)
                value = get_ordered_value(constants.FILE, file_obj.get('value')) if file_obj else None
                uuid = file_obj.get('uuid') if file_obj else None

            listing.append({
                'uuid': uuid,
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
                },
                'metadata': value if value else None
            })
    except IndexError:
        # Return [] if the listing is empty.
        listing = []

    # Update Elasticsearch after each listing.
    tapis_listing_indexer.delay(listing)
    return {'listing': listing, 'reachedEnd': len(listing) < int(limit), 'folder_metadata': folder_entity_value}


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

@transaction.atomic
def mkdir(client, system, path, dir_name, metadata=None, **kwargs):
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

    if metadata is not None: 
        new_meta = create_entity_metadata(system, 'drp.project.trash', {
            **metadata,
        })
        add_node_to_project(system, 'NODE_ROOT', new_meta.uuid, new_meta.name, dir_name)

    client.files.mkdir(systemId=system, path=path_input)

    tapis_indexer.apply_async(kwargs={'access_token': client.access_token.access_token,
                                    'systemId': system,
                                    'filePath': path,
                                    'recurse': False},
                            )

    return {"result": "OK"}

@transaction.atomic
def move(client, src_system, src_path, dest_system, dest_path, file_name=None, metadata=None, **kwargs):
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

    if metadata is not None:
        if (metadata.get('data_type') == 'file'):
            patch_file_association(src_system, metadata, src_path, dest_path_full, file_name, 'move')
        else: 
            patch_entity_and_node(src_system, metadata, src_path, dest_path, file_name)

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

@transaction.atomic
def copy(client, src_system, src_path, dest_system, dest_path, file_name=None, metadata=None,
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

    if metadata is not None:
        if (metadata.get('data_type') == 'file'):
            patch_file_association(src_system, metadata, src_path, dest_path_full, file_name, 'copy')

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

@transaction.atomic
def delete(client, system, path):
    # Delete file metadata
    try:
        DataFilesMetadata.objects.get(path=f'{system}/{path.strip("/")}').delete()
    except DataFilesMetadata.DoesNotExist:
        pass

def delete(client, system, path, *args, **kwargs):
    return client.files.delete(systemId=system,
                               path=path,
                               headers={"X-Tapis-Tracking-ID": kwargs.get("tapis_tracking_id", "")})

def rename(client, system, path, new_name, metadata=None, *args, **kwargs):
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
                dest_system=system, dest_path=new_path, file_name=new_name, metadata=metadata, **kwargs)

def trash(client, system, path, homeDir, metadata=None, *args, **kwargs):
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

    try:
        if metadata is not None:
            trash_entity = get_entity(system, f'{settings.TAPIS_DEFAULT_TRASH_NAME}')
            if not trash_entity:
                new_entity = create_entity_metadata(system, constants.TRASH, {})
                add_node_to_project(system, 'NODE_ROOT', new_entity.uuid, new_entity.name, settings.TAPIS_DEFAULT_TRASH_NAME)
    except Exception as e:
        print(f'Error creating trash entity: {e}')

    resp = move(client, system, path, system,
                f'{homeDir}/{settings.TAPIS_DEFAULT_TRASH_NAME}', file_name, metadata, **kwargs)

    return resp

@transaction.atomic
def upload(client, system, path, uploaded_file, metadata=None, *args, **kwargs):
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

    if metadata is not None and getattr(constants, metadata.get('data_type').upper(), None): 
        
        parent_node = get_node_from_path(system, path)

        file_obj = create_file_obj(system, uploaded_file.name, uploaded_file.size, dest_path, metadata)

        if parent_node and parent_node['id'] != 'NODE_ROOT':
            add_file_associations(parent_node['uuid'], [file_obj])
        else: 
            # Add file association to root node if no parent node/entity exists
            root_node = get_root_node(system)
            add_file_associations(root_node['uuid'], [file_obj])

        # additional processing for files
        if len(metadata) > 1:
            encoded_file = base64.b64encode(uploaded_file.read()).decode('utf-8')
            uploaded_file.seek(0)
            transaction.on_commit(lambda: process_file.delay(file_obj.system, file_obj.path, client.access_token.access_token, encoded_file))

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

@transaction.atomic
def update_metadata(client, system, path, new_path, old_name, new_name, metadata):
    if (old_name != new_name) or (os.path.dirname(path) != new_path):
        move_result = move(client, src_system=system, src_path=path,
                dest_system=system, dest_path=new_path, file_name=new_name)
        # update the name in the case it was changed during the move operation
        move_message = move_result['message'].split('DestinationPath: ', 1)[1]
        new_name = ('/' + move_message).rsplit('/', 1)[1]
        
    update_datafile_metadata(system=system, name=new_name, old_path=path, new_path=f'{new_path.strip("/")}/{new_name}', metadata=metadata)

def validate_datafile_metadata(metadata): 
    portal_name = settings.PORTAL_NAMESPACE
    schema = SCHEMA_MAPPING[portal_name][metadata.get('data_type')]
    validated_model = schema.model_validate(metadata)

    return validated_model.model_dump(exclude_none=True)