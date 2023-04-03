import os
import io
import magic
import logging
from googleapiclient.http import MediaIoBaseUpload, MediaIoBaseDownload


logger = logging.getLogger(__name__)


def listing(client, system, path, offset=None, limit=100, nextPageToken=None,
            *args, **kwargs):
    if not path:
        path = 'root'
    fields = ("mimeType, name, id, modifiedTime, "
              "fileExtension, size, parents, webViewLink")
    listing_call = client.files()\
        .list(q="'{}' in parents and trashed=False".format(path),
              fields="files({}), nextPageToken"
              .format(fields), pageSize=limit, pageToken=nextPageToken)\
        .execute()
    listing = listing_call.get('files')
    scroll_token = listing_call.get('nextPageToken')
    reached_end = not bool(scroll_token)
    folder_mimetype = 'application/vnd.google-apps.folder'
    listing = list(map(lambda f: {
        'system': 'googledrive',
        'type': 'dir' if f['mimeType'] == folder_mimetype else 'file',
        'format': 'folder' if f['mimeType'] == folder_mimetype else 'raw',
        'mimeType': f['mimeType'],
        'path': f['id'],
        'name': f['name'],
        'length': int(f['size']) if 'size' in f.keys() else 0,
        'lastModified': f['modifiedTime'],
        '_links': {
            'self': {'href': f['webViewLink']}
        }
    }, listing))

    return {'listing': listing,
            'nextPageToken': scroll_token,
            'reachedEnd': reached_end}


def search(client, system, path, offset=None, limit=100, nextPageToken=None,
           query_string='', *args, **kwargs):
    if not path:
        path = 'root'
    fields = ("mimeType, name, id, modifiedTime, "
              "fileExtension, size, parents, webViewLink")
    listing_call = client.files()\
        .list(q=("'{path}' in parents and "
                 "trashed=False and "
                 "name contains '{query_string}'")
              .format(path=path, query_string=query_string),
              fields="files({}), nextPageToken"
              .format(fields), pageSize=limit, pageToken=nextPageToken)\
        .execute()
    listing = listing_call.get('files')
    scroll_token = listing_call.get('nextPageToken')
    reached_end = not bool(scroll_token)
    folder_mimetype = 'application/vnd.google-apps.folder'
    listing = list(map(lambda f: {
        'system': 'googledrive',
        'type': 'dir' if f['mimeType'] == folder_mimetype else 'file',
        'format': 'folder' if f['mimeType'] == folder_mimetype else 'raw',
        'mimeType': f['mimeType'],
        'path': f['id'],
        'name': f['name'],
        'length': int(f['size']) if 'size' in f.keys() else 0,
        'lastModified': f['modifiedTime'],
        '_links': {
            'self': {'href': f['webViewLink']}
        }
    }, listing))

    return {'listing': listing,
            'nextPageToken': scroll_token,
            'reachedEnd': reached_end}


def iterate_listing(client, system, path, limit=100):
    if not path:
        path = 'root'
    scroll_token = None
    while True:
        _listing = listing(client, system, path, limit=limit,
                           nextPageToken=scroll_token)

        scroll_token = _listing['nextPageToken']
        yield from _listing['listing']

        if not scroll_token:
            break


def walk_all(client, system, path, limit=100):
    if not path:
        path = 'root'
    for f in iterate_listing(client, system, path, limit):
        yield f
        if f['format'] == 'folder':
            yield from walk_all(client, system, f['path'], limit)


def upload(client, system, path, uploaded_file, *args, **kwargs):
    if not path:
        path = 'root'
    mimetype = magic.from_buffer(uploaded_file.getvalue(), mime=True)
    media = MediaIoBaseUpload(uploaded_file, mimetype=mimetype)
    file_meta = {
        'name': os.path.basename(uploaded_file.name),
        'parents': [path]
    }
    client.files().create(body=file_meta, media_body=media).execute()


def mkdir(client, system, path, dir_name):
    if not path:
        path = 'root'
    file_metadata = {
        'name': dir_name,
        'parents': [path],
        'mimeType': 'application/vnd.google-apps.folder'
    }
    fields = 'mimeType, name, id, modifiedTime, fileExtension, size, parents'
    newdir = client.files().create(body=file_metadata,
                                   fields=fields).execute()

    folder_mimetype = 'application/vnd.google-apps.folder'
    newdir_dict = {
        'system': None,
        'type': 'dir' if newdir['mimeType'] == folder_mimetype else 'file',
        'format': 'folder' if newdir['mimeType'] == folder_mimetype else 'raw',
        'mimeType': newdir['mimeType'],
        'path': newdir['id'],
        'name': newdir['name'],
        'length': 0,
        'lastModified': newdir['modifiedTime'],
    }

    return newdir_dict


def download(client, system, path, *args, **kwargs):
    if not path:
        path = 'root'
    file_id = path
    file_name = client.files().get(fileId=file_id, fields="name")\
        .execute()['name']
    request = client.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()

    fh.name = file_name
    return fh


def copy(client, src_system, src_path, dest_system, dest_path, file_name,
         filetype='file', dest_path_name='', *args):
    from portal.libs.transfer.operations import transfer, transfer_folder
    if not src_path:
        src_path = 'root'
    # Google drive doesn't have a robust copy API, so this endpoint uses
    # generic transfer methods.
    if filetype == 'file':
        transfer(client, client, 'googledrive', 'googledrive', src_system,
                 dest_system, src_path, dest_path)
    if filetype == 'dir':
        transfer_folder(client, client, 'googledrive', 'googledrive',
                        src_system, dest_system, src_path, dest_path,
                        file_name)

    return {'nativeFormat': filetype,
            'name': dest_path_name,
            'path': os.path.join(dest_path_name, file_name),
            'systemId': dest_system}
