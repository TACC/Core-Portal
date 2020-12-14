from portal.libs.agave import operations as tapis_operations
from portal.libs.googledrive import operations as googledrive_operations

api_mapping = {
    'googledrive': {
        'upload': googledrive_operations.upload,
        'download': googledrive_operations.download,
        'iterate_listing': googledrive_operations.iterate_listing,
        'mkdir': googledrive_operations.mkdir
    },
    'tapis': {
        'upload': tapis_operations.upload,
        'download': tapis_operations.download_bytes,
        'iterate_listing': tapis_operations.iterate_listing,
        'mkdir': tapis_operations.mkdir
    }
}


def transfer(src_client, dest_client, src_api, dest_api, src_system,
             dest_system, src_path, dest_path, *args, **kwargs):

    _download = api_mapping[src_api]['download']
    _upload = api_mapping[dest_api]['upload']

    file_bytes = _download(src_client, src_system, src_path)
    file_upload = _upload(dest_client, dest_system, dest_path, file_bytes)

    return file_upload


def transfer_folder(src_client, dest_client, src_api, dest_api, src_system,
                    dest_system, src_path, dest_path, dirname, *args,
                    **kwargs):
    _iterate_listing = api_mapping[src_api]['iterate_listing']
    _download = api_mapping[src_api]['download']
    _upload = api_mapping[dest_api]['upload']
    _mkdir = api_mapping[dest_api]['mkdir']

    newdir = _mkdir(dest_client, dest_system, dest_path, dirname)
    for f in _iterate_listing(src_client, src_system, src_path):
        if f['format'] == 'folder':
            return transfer_folder(src_client, dest_client, src_api, dest_api,
                                   src_system, dest_system, f['path'],
                                   newdir['path'], f['name'])
        else:
            file_bytes = _download(src_client, src_system, f['path'])
            file_upload = _upload(dest_client, dest_system, newdir['path'],
                                  file_bytes)
            return file_upload
