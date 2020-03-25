""" Google Drive filemanager"""
import os
import re
import sys
import logging
import io
import time
from abc import abstractproperty
from portal.exceptions.api import ApiException
from portal.libs.googledrive.files import GoogleDriveFile
from portal.apps.notifications.models import Notification
from portal.apps.googledrive_integration.models import GoogleDriveUserToken
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.http import (JsonResponse, HttpResponseBadRequest)
from requests import HTTPError
from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload, HttpError
from portal.apps.search.tasks import agave_indexer
from portal.libs.agave.models.files import BaseFile
from portal.apps.data_depot.managers.base import AgaveFileManager
from portal.libs.agave.serializers import BaseAgaveFileSerializer
from portal.apps.data_depot.managers.base import AbstractFileManager
from future.utils import python_2_unicode_compatible

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


@python_2_unicode_compatible
class FileManager(AbstractFileManager):

    NAME = 'google-drive'

    def __init__(self, request, **kwargs):
        super(FileManager, self).__init__(request, **kwargs)
        self.serializer_cls = BaseAgaveFileSerializer

        try:
            self.googledrive_api = request.user.googledrive_user_token.client
        except GoogleDriveUserToken.DoesNotExist:
            message = 'Connect your Google Drive account <a target="_blank" href="{}">here.</a>'.format(
                reverse('googledrive_integration:index'))
            raise ApiException(status=409, message=message, extra={
                'action_url': reverse('googledrive_integration:index'),
                'action_label': 'Connect Google Drive Account'
            })

    @property
    def requires_auth(self):
        """Weather it should check for an authenticated user.

        If this is a public data file manager, it should return False.
        """
        return True

    @property
    def encoder_cls(self):
        """Returns encoder cls"""
        return self.serializer_cls

    def parse_file_id(self, file_id):
        if file_id is not None:
            file_id = file_id.strip('/')
            try:
                file_type, file_id = GoogleDriveFile.parse_file_id(file_id)
            except AssertionError:
                # file path is hierarchical; need to find the GoogleDriveObject here
                logger.debug('parse_file_id, file_id:{}'.format(file_id))
                fields = "mimeType, name, id, modifiedTime, fileExtension, size, parents"
                googledrive_item = GoogleDriveFile(self.googledrive_api.files().get(
                    fileId=file_id, fields=fields).execute(), drive=self.googledrive_api)

                file_type = googledrive_item.type
        else:
            file_type, file_id = u'dir', u'root'

        return file_type, file_id

    def listing(self, file_id=None, **kwargs):
        """
        Lists contents of a folder or details of a file.

        Args:
            file_id: The type/id of the Google Drive Object. This should be formatted {type}/{id}
            where {type} is one of ['dir', 'file'] and {id} is the numeric Google Drive ID for
            the object.

        Returns:
            Dictionary with two keys;
              - resource: File System resource that we're listing
              - files: Array of Api file-like objects
        """

        default_pems = 'ALL'

        try:
            if file_id == '/':
                # top level dir
                file_id = 'root'

            file_type, file_id = self.parse_file_id(file_id)
            fields = "mimeType, name, id, modifiedTime, fileExtension, size, parents"
            googledrive_item = self.googledrive_api.files().get(
                fileId=file_id, fields=fields).execute()

            child_results = self.googledrive_api.files().list(q="'{}' in parents and trashed=False".format(
                file_id), fields="files({})".format(fields)).execute()
            if file_type == 'dir':

                children = [GoogleDriveFile(item, parent=googledrive_item, drive=self.googledrive_api).to_dict(default_pems=default_pems)
                            for item in child_results['files']]
                child_folders = sorted([item for item in children if item['type']
                                        == 'dir'], key=lambda k: os.path.splitext(k['name'])[0])
                child_files = sorted([item for item in children if item['type']
                                      == 'file'], key=lambda k: os.path.splitext(k['name'])[0])
                children = child_folders + child_files
            else:
                children = None

            list_data = GoogleDriveFile(
                googledrive_item, drive=self.googledrive_api).to_dict(default_pems=default_pems)

            if children:
                list_data['children'] = children

            return list_data

        except AssertionError:
            raise ApiException(
                status=404, message='The file you requested does not exist.')

        except Exception as e:
            if 'invalid_grant' in str(e):
                message = 'While you previously granted this application access to Google Drive, ' \
                    'that grant appears to be no longer valid. Please ' \
                    '<a href="{}">disconnect and reconnect your Google Drive account</a> ' \
                    'to continue using Google Drive data.'.format(reverse(
                          'googledrive_integration:index'))
                raise ApiException(status=401, message=message)

            message = 'Unable to communicate with Google Drive: {}'.format(e)
            raise ApiException(status=500, message=message)

    def is_shared(self, *args, **kwargs):
        return False

    def is_search(self, *args, **kwargs):
        return False

    def copy(self, src_file_id, dest_file_id, **kwargs):
        try:
            file_type, file_id = self.parse_file_id(file_id=src_file_id)

            googledrive_item = self.googledrive_api.files().get(
                fileId=file_id, fields="name, webContentLink, ownedByMe, mimeType").execute()
            n = Notification(event_type='data',
                             status=Notification.INFO,
                             operation='googledrive_download_start',
                             message='Starting copy of {} {} from Google Drive.'.format(
                                 file_type, googledrive_item['name']),
                             user=self.username,
                             extra={})
            n.save()
            logger.debug('username: {}, filename: {}, src_file_id: {}, dest_file_id: {}'.format(
                self.username, googledrive_item['name'], src_file_id, dest_file_id))

            agave_fm = AgaveFileManager(client=self._ac)

            if file_type == 'file':
                resp = self.copy_file(
                    file_id, dest_file_id, googledrive_item, agave_fm=agave_fm)

                if resp is None:
                    return None

            elif file_type == 'dir':
                resp = self.copy_folder(
                    file_id, dest_file_id, googledrive_item, agave_fm=agave_fm)

            else:
                raise ApiException(
                    message='Unsupported file type: {}'.format(file_type), status=415)

            system, path = agave_fm._parse_file_id(dest_file_id)
            listing = BaseFile.listing(
                self._ac, system, path)

            agave_indexer.apply_async(kwargs={'systemId': listing.system, 'filePath': os.path.dirname(
                listing.path), 'recurse': False}, routing_key='indexing')
            if listing.format == 'folder':
                agave_indexer.apply_async(kwargs={
                                          'systemId': listing.system, 'filePath': listing.path, 'recurse': True}, routing_key='indexing')

            n = Notification(event_type='data',
                             status=Notification.SUCCESS,
                             operation='googledrive_download_end',
                             message='{} "{}" was copied from Google Drive successfully!'.format(
                                 file_type.capitalize(), googledrive_item['name']),
                             user=self.username,
                             extra={})
            n.save()

            return listing

        except Exception as e:
            logger.exception('Unexpected task failure: googledrive_copy', extra={
                'username': self.username,
                'file_id': src_file_id,
                'dest_file_id': dest_file_id,
                'error_type': type(e),
                'error': str(e)
            })
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='googledrive_copy_error',
                             message='We were unable to copy the file from Google Drive. '
                                     'Please try again...',
                             user=self.username,
                             extra={'path': googledrive_item['name']})
            n.save()
            raise

    def copy_file(self, file_id, dest_file_id=None, googledrive_file=None, _file_dest=None, agave_fm=None):
        if not googledrive_file:
            googledrive_file = self.googledrive_api.files().get(
                fileId=file_id, fields="name, webContentLink, ownedByMe, mimeType").execute()

        if not googledrive_file.get('webContentLink'):
            n = Notification(event_type='data',
                             status=Notification.ERROR,
                             operation='googledrive_download_error',
                             message='File is not a binary type file.',
                             user=self.username,
                             extra={'path': "'{}' of type {}".format(googledrive_file['name'], googledrive_file['mimeType'])})
            n.save()
            return None

        if not agave_fm:
            # Initialize agave filemanager
            agave_fm = AgaveFileManager(client=self._ac)

        if not _file_dest:
            _file_dest = agave_fm.get_file(dest_file_id)

        # if user owns file, make file viewable by anyone with link to allow user to download the file
        if googledrive_file['ownedByMe']:
            file_pems = self.googledrive_api.permissions().list(
                fileId=file_id).execute()['permissions']
            if 'anyoneWithLink' not in [pem['id'] for pem in file_pems]:
                body = {'role': 'reader',
                        'type': 'anyone'}
                update_pems = self.googledrive_api.permissions().create(
                    fileId=file_id, body=body).execute()

                from portal.apps.data_depot.tasks import external_resource_revoke_shared_pems
                external_resource_revoke_shared_pems.apply_async(kwargs={
                    'file_mgr_name': self.NAME,
                    'revoke_method_name': self.revoke_shared_pems.__name__,
                    'username': self.username,
                    'file_id': file_id,
                    'permission_id': update_pems['id']}, countdown=30)

        remote_url = googledrive_file['webContentLink'].encode('ascii')
        logger.debug('Importing Google File: {}'.format(googledrive_file))
        resp = _file_dest.import_data('Google Drive', googledrive_file['name'].encode(
            'ascii'), remote_url=remote_url, external_resource=True)

        return resp

    def copy_folder(self, folder_id, dest_file_id=None, googledrive_folder=None, _file_dest=None, agave_fm=None):
        """
        Recursively copy the folder for folder_id, and all of its contents, to the given
        dest_file_id.

        :param folder_id:
        :param dest_file_id:
        :return:
        """

        if not googledrive_folder:
            googledrive_folder = self.googledrive_api.files().get(
                fileId=folder_id, fields="name").execute()

        if not agave_fm:
            # Initialize agave filemanager
            agave_fm = AgaveFileManager(client=self._ac)

        if not _file_dest:
            _file_dest = agave_fm.get_file(dest_file_id)

        # convert utf-8 chars
        safe_dirname = googledrive_folder['name'].encode(
            sys.getfilesystemencoding(), 'ignore')
        logger.debug(
            'Creating directory {}/{}'.format(_file_dest.agave_uri, safe_dirname))

        new_fol = _file_dest.mkdir(safe_dirname)

        children = self.googledrive_api.files().list(
            q="'{}' in parents and trashed=False".format(folder_id)).execute()
        for child in children['files']:
            if child['mimeType'] == 'application/vnd.google-apps.folder':
                resp = self.copy_folder(
                    child['id'], _file_dest=new_fol, agave_fm=agave_fm)
            else:
                try:
                    logger.debug('Google File Copy: {} to {}'.format(
                        child['id'], new_fol.agave_uri))
                    resp = self.copy_file(
                        child['id'], _file_dest=new_fol, agave_fm=agave_fm)
                    logger.info(
                        'Google File copy complete to: {}'.format(resp.agave_uri))
                except Exception as e:
                    logger.exception('Unexpected task failure: googledrive_download', extra={
                        'username': self.username,
                        'file_id': child['id'],
                        'dest_file_id': '/'.join([_file_dest.agave_uri, child['id']]),
                        'error_type': type(e),
                        'error': str(e)
                    })
                    n = Notification(event_type='data',
                                     status=Notification.ERROR,
                                     operation='googledrive_download_error',
                                     message='We were unable to download file from Google Drive. '
                                     'Please try again...',
                                     user=self.username,
                                     extra={'path': child['name']})
                    n.save()
                    raise

        return new_fol

    def get_preview_url(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            googledrive_file = self.googledrive_api.files().get(
                fileId=file_id, fields="webViewLink, ownedByMe, size").execute()

            # if user owns file, make file viewable by anyone with link to allow portal to preview the file
            if googledrive_file['ownedByMe']:
                file_pems = self.googledrive_api.permissions().list(
                    fileId=file_id).execute()['permissions']
                if 'anyoneWithLink' not in [pem['id'] for pem in file_pems]:
                    body = {'role': 'reader',
                            'type': 'anyone'}
                    update_pems = self.googledrive_api.permissions().create(
                        fileId=file_id, body=body).execute()
                    from portal.apps.data_depot.tasks import external_resource_revoke_shared_pems
                    external_resource_revoke_shared_pems.apply_async(kwargs={
                        'file_mgr_name': self.NAME,
                        'revoke_method_name': self.revoke_shared_pems.__name__,
                        'username': self.username,
                        'file_id': file_id,
                        'permission_id': update_pems['id']}, countdown=30)
            return googledrive_file['webViewLink'].replace('view?usp=drivesdk', 'preview').replace('edit?usp=drivesdk', 'preview')
        return None

    def get_download_url(self, file_id, **kwargs):
        file_type, file_id = self.parse_file_id(file_id)
        if file_type == 'file':
            googledrive_file = self.googledrive_api.files().get(
                fileId=file_id, fields="webContentLink, ownedByMe, mimeType, name").execute()

            if 'webContentLink' not in googledrive_file:
                n = Notification(event_type='data',
                                 status=Notification.ERROR,
                                 operation='googledrive_download_error',
                                 message='Downloading Google-type files is currently unsupported. Convert the file to'
                                 ' a standard format and try again.',
                                 user=self.username,
                                 extra={'path': googledrive_file['name']})  # show file in Notification
                n.save()
                raise ApiException(status=400, message='No webContentLink in file')

            # if user owns file, make file viewable by anyone with link to allow user to download the file
            if googledrive_file['ownedByMe']:
                file_pems = self.googledrive_api.permissions().list(
                    fileId=file_id).execute()['permissions']
                if 'anyoneWithLink' not in [pem['id'] for pem in file_pems]:
                    body = {'role': 'reader',
                            'type': 'anyone'}
                    update_pems = self.googledrive_api.permissions().create(
                        fileId=file_id, body=body).execute()

                    from portal.apps.data_depot.tasks import external_resource_revoke_shared_pems
                    external_resource_revoke_shared_pems.apply_async(kwargs={
                        'file_mgr_name': self.NAME,
                        'revoke_method_name': self.revoke_shared_pems.__name__,
                        'username': self.username,
                        'file_id': file_id,
                        'permission_id': update_pems['id']}, countdown=30)
            return googledrive_file['webContentLink']

        return None

    def download(self, file_id, preview=True, **kwargs):
        """Download a file.

        :param str file_id: Id representing a file/folder.

        :returns: Downloaded file stream.
        :rtype: byte[]

        .. todo::
            Implement folder download.
        """
        file_type, file_id = self.parse_file_id(file_id)

        if preview:
            url = self.get_preview_url(file_id)
        else:
            url = self.get_download_url(file_id)
        
        return {'href': url, 'fileType': file_type}

    def upload(self, file_id_dest, uploaded_files, ensure_path=False, **kwargs):
        # try:
        #     n = Notification(event_type='data',
        #                      status=Notification.INFO,
        #                      operation='googledrive_upload_start',
        #                      message='Uploading file %s to Google Drive.' % (
        #                          src_file_id,),
        #                      user=username,
        #                      extra={})
        #     n.save()
        #     user = get_user_model().objects.get(username=username)

        #     from portal.apps.data_depot.managers.base import AgaveFileManager
        #     # Initialize agave filemanager
        #     agave_fm = AgaveFileManager(client=user.agave_oauth.client)
        #     # Split src ination file path
        #     src_file_path_comps = src_file_id.strip('/').split('/')
        #     # If it is an agave file id then the first component is a system id
        #     agave_system_id = src_file_path_comps[0]
        #     # Start construction the actual real path into the NSF mount
        #     if src_file_path_comps[1:]:
        #         src_real_path = os.path.join(*src_file_path_comps[1:])
        #     else:
        #         src_real_path = '/'
        #     # Get what the system id maps to
        #     base_mounted_path = agave_fm.base_mounted_path(agave_system_id)
        #     # Add actual path
        #     if re.search(r'^project-', agave_system_id):
        #         project_dir = agave_system_id.replace('project-', '', 1)
        #         src_real_path = os.path.join(
        #             base_mounted_path, project_dir, src_real_path.strip('/'))
        #     else:
        #         src_real_path = os.path.join(
        #             base_mounted_path, src_real_path.strip('/'))
        #     logger.debug('src_real_path: {}'.format(src_real_path))
        #     logger.debug('dest_folder_id:{}'.format(dest_folder_id))

        #     if dest_folder_id == '':
        #         dest_folder_id = 'root'

        #     file_type, folder_id = self.parse_file_id(
        #         file_id=dest_folder_id.strip('/'))
        #     if os.path.isfile(src_real_path):
        #         self.upload_file(folder_id, src_real_path)
        #     elif os.path.isdir(src_real_path):
        #         self.upload_directory(folder_id, src_real_path)
        #     else:
        #         logger.error('Unable to upload %s: file does not exist!',
        #                      src_real_path)

        #     n = Notification(event_type='data',
        #                      status=Notification.SUCCESS,
        #                      operation='googledrive_upload_end',
        #                      message='File "%s" was copied to Google Drive successfully!' % (
        #                          src_file_id, ),
        #                      user=username,
        #                      extra={})
        #     n.save()
        # except Exception as err:
        #     logger.exception('Unexpected task failure: googledrive_upload', extra={
        #         'username': username,
        #         'src_file_id': src_file_id,
        #         'dst_file_id': dest_folder_id,
        #         'error': err
        #     })
        #     n = Notification(event_type='data',
        #                      status=Notification.ERROR,
        #                      operation='googledrive_upload_error',
        #                      message='We were unable to upload the specified file to Google Drive. '
        #                              'Please try again...',
        #                      user=username,
        #                      extra={})
        #     n.save()
        #     raise
        raise ApiException('Uploading to Google Drive is not supported.', status=405,
                           extra={'file_id_dest': file_id_dest,
                                  'kwargs': kwargs})

    # def upload_file(self, folder_id, file_real_path):

    #     file_path, file_name = os.path.split(file_real_path)
    #     file_metadata = {'name': file_name, 'parents': [folder_id]}
    #     logger.debug('file_metadata:{}'.format(file_metadata))
    #     mimetype = None
    #     if not os.path.splitext(file_name)[1]:
    #         # Required for files with names like '.astylerc'
    #         mimetype = "text/plain"

    #     CHUNK_SIZE = 5 * 1024 * 1024  # 5MB
    #     file_size = os.path.getsize(file_path)

    #     if file_size < CHUNK_SIZE:
    #         media = MediaFileUpload(file_real_path, mimetype=mimetype)
    #         uploaded_file = self.googledrive_api.files().create(
    #             body=file_metadata, media_body=media, fields='id').execute()
    #         logger.info('Successfully uploaded {} to googledrive:folder/{} as googledrive:file/{}'.format(
    #             file_real_path, folder_id, uploaded_file.get('id')))
    #     else:
    #         media = MediaFileUpload(
    #             file_real_path, mimetype=mimetype, resumable=True)
    #         request = self.googledrive_api.files().create(
    #             body=file_metadata, media_body=media, fields='id').execute()
    #         media.stream()
    #         response = None
    #         while response is None:
    #             status, response = request.next_chunck()
    #             if status:
    #                 logger.debug("Uploaded {}%% to google drive".format(
    #                     status.progress() * 100))
    #         logger.info('Successfully uploaded %s to googledrive:folder/%s as googledrive:file/%s',
    #                     file_real_path, folder_id, response['id'])

    # def upload_directory(self, parent_folder_id, dir_real_path):
    #     """
    #     Recursively uploads the directory and all of its contents (subdirectories and files)
    #     to the Google Drive folder specified by parent_folder_id.

    #     :param parent_folder_id: The Google Drive folder to upload the directory to.
    #     :param dir_real_path: The real path on the filesystem of the directory to upload.
    #     :return: The new Google Drive folder.
    #     """

    #     dirparentpath, dirname = os.path.split(dir_real_path)
    #     logger.info('Create directory %s in Google Drive folder/%s',
    #                 dirname, parent_folder_id)

    #     folder_metadata = {'name': dirname, 'parents': parent_folder_id,
    #                        'mimeType': 'application/vnd.google-apps.folder'}

    #     googledrive_folder = self.googledrive_api.files().create(
    #         body=folder_metadata, fields='id').execute()

    #     for dirpath, subdirnames, filenames in os.walk(dir_real_path):
    #         # upload all the files
    #         for filename in filenames:
    #             filepath = os.path.join(dirpath, filename)
    #             self.upload_file(googledrive_folder['id'], filepath)

    #         # upload all the subdirectories
    #         for subdirname in subdirnames:
    #             subdirpath = os.path.join(dirpath, subdirname)
    #             self.upload_directory(googledrive_folder['id'], subdirpath)

    #         # prevent further walk, because recursion
    #         subdirnames[:] = []

    #     return googledrive_folder

    def pems(self, file_id, username=None, **kwargs):
        """Return file's permissions.

        :param str file_id: Id representing a file/folder.
        :param str username: Optionally, give a username to return that
         user's permissions.

        :returns: A list of permissions.
        :rtype: list
        """
        user_pem = {
            'username': self.username,
            'permission': {
                'read': True,
                'write': False,
                'execute': False
            }
        }

        # _, file_id = self.parse_file_id(file_id)
        # googledrive_item = self.googledrive_api.files().get(
        #     fileId=file_id, fields="ownedByMe").execute()

        # if googledrive_item['ownedByMe']:
        #     user_pem['permission'] = {
        #         'read': True, 'write': True, 'execute': True}
        # else:
        #     user_pem['permission'] = {'read': True}
        return [user_pem]

    @staticmethod
    def revoke_shared_pems(username, file_id, permission_id):
        """Revoke shared permissions from google object after imposing
        world readable permissions for previewing and downloading.
        """
        user = get_user_model().objects.get(username=username)
        try:
            drive_api = user.googledrive_user_token.client
        except GoogleDriveUserToken.DoesNotExist:
            raise ApiException(
                status=409, message='No token for username: {}'.format(username))
        return drive_api.permissions().delete(fileId=file_id, permissionId=permission_id).execute()

    def mkdir(self, file_id, name, **kwargs):
        raise ApiException('Google Drive: mkdir is not supported.', status=405,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def rename(self, file_id_src, rename_to, **kwargs):
        raise ApiException('Google Drive: rename is not supported.', status=405,
                           extra={'file_id_src': file_id_src,
                                  'kwargs': kwargs})

    def move(self, file_id_src, file_id_dest, **kwargs):
        raise ApiException('Google Drive: move is not supported.', status=405,
                           extra={'file_id_src': file_id_src,
                                  'kwargs': kwargs})

    def trash(self, file_id, **kwargs):
        raise ApiException('Google Drive: trash is not supported.', status=405,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def delete(self, file_id, **kwargs):
        raise ApiException('Google Drive: delete is not supported.', status=405,
                           extra={'file_id': file_id,
                                  'kwargs': kwargs})

    def update_pems(self, **kwargs):
        raise ApiException('Google Drive: update_pems is not supported.', status=405,
                           extra={'kwargs': kwargs})

    def share(self, **kwargs):
        raise ApiException('Google Drive: share is not supported.', status=405,
                           extra={'kwargs': kwargs})
