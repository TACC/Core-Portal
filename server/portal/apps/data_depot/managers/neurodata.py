from __future__ import unicode_literals, absolute_import
from portal.apps.data_depot.managers.base import AbstractFileManager
from portal.apps.data_depot.managers.base import AgaveFileManager
from portal.libs.agave.serializers import BaseAgaveFileSerializer
from django.http import HttpResponse
import logging
from django.conf import settings
from json import JSONEncoder
import requests
import base64
from io import BytesIO
from future.utils import python_2_unicode_compatible

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


class FileManager(AbstractFileManager):

    def __init__(self, *args, **kwargs):
        self.serializer_cls = JSONEncoder
        super(FileManager, self).__init__(*args, **kwargs)

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

    def listing(self, file_id, **kwargs):

        file_comps = file_id.split('/', 1)
        system = file_comps[0]
        path = file_comps[1]

        req_header = {'Authorization': 'Token {}'.format(
            settings.NEURODATA_SUPER_TOKEN)}
        req_url = 'https://api.boss.neurodata.io/v1/{}'.format(path)
        resp = requests.get(req_url, headers=req_header)
    
        resp_json = resp.json()

        if system == 'collection':
            description = None
            children = [{
                'name': name,
                'path': path,
                'type': 'folder',
                'permissions': 'READ',
                'system': 'collection'} for name in resp_json['collections']]
        elif system == 'experiment':
            description = resp_json['description']
            children = [{
                'name': name,
                'path': path,
                'type': 'folder', 
                'permissions': 'READ',
                'system': 'experiment'} for name in resp_json['experiments']]
        elif system == 'channel':
            description = resp_json['description']
            children = [{
                'name': name,
                'path': path,
                'type': 'file', 
                'permissions': 'READ',
                'system': 'channel'} for name in resp_json['channels']]
        elif system == 'channel.preview':
            description = resp_json['description']
            children = [{
                'name': resp_json['name'],
                'path': path,
                'permissions': 'READ',
                'system': 'channel',
                'description': resp_json['description'],
                'default_time_sample': resp_json['default_time_sample'],
                'type': resp_json['type'],
                'base_resolution': resp_json['base_resolution'],
                'datatype': resp_json['datatype'],
                'creator': resp_json['creator'],
                'downsample_status': resp_json['downsample_status']
            }]

        return {
            'description': description,
            'children': children,
            'format': 'folder',
            'mimeType': 'text/directory',
            'name': '',
            'path': '/',
            'system': None,
            'permissions': 'READ'
        }

    def download(self, file_id, req_body, preview=True):
        options = req_body['options']
        req_header = {'Authorization': 'Token {}'.format(
            settings.NEURODATA_SUPER_TOKEN), "Accept": "image/jpeg"}
        req_url = 'https://api.boss.neurodata.io/v1/cutout/{}/{}/{}/{}/{}:{}/{}:{}/{}:{}/'.format(
            options['collection'],
            options['experiment'],
            options['channel'],
            options['resolution'],
            options['x_start'],
            options['x_stop'],
            options['y_start'],
            options['y_stop'],
            options['z_start'],
            options['z_stop']
        )

        resp = requests.get(req_url, headers=req_header)
        return base64.b64encode(resp.content)

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
        return [user_pem]

    def coord_frame(self, file_id):
        file_comps = file_id.split('/', 1)
        path = file_comps[1]

        req_header = {'Authorization': 'Token {}'.format(
            settings.NEURODATA_SUPER_TOKEN)}
        exp_url = 'https://api.boss.neurodata.io/v1/{}'.format(path)
        resp1 = requests.get(exp_url, headers=req_header)

        coord = resp1.json()['coord_frame']

        coord_url = 'https://api.boss.neurodata.io/v1/coord/{}'.format(coord)
        resp = requests.get(coord_url, headers=req_header)
        return resp.json()

    def copy(self, file_id_src, file_id_dest, **kwargs):
        """Copy a file.

        :param str file_id_src: Id representing file/folder.
        :param str file_id_dest: Id representing file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    def delete(self, file_id, **kwargs):
        """Delete a file.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    def share(self, file_id, **kwargs):
        """Return file's permissions.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    def mkdir(self, file_id, **kwargs):
        """Create a directory.

        :param str file_id: Id representing a file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    def move(self, file_id_src, file_id_dest, **kwargs):
        """Move a file.

        :param str file_id_src: Id representing file/folder.
        :param str file_id_dest: Id representing file/folder.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    def update_pems(self, file_id, pems, **kwargs):
        """Update permissions on a file.

        :param str file_id: Id representing a file/folder.
        :param list pems: List with permissions. Each object in the list
         must be a dict with *at least* two keys ``username``: a string
         and ``pem``: a string with the permission value. If the target
         resource were to need more data to update the permissions, the
         manager implementation should take care of this.

        :returns: A file object.
        :rtype: obj
        """
        return NotImplemented

    def upload(self, file_id_dest, req_body, **kwargs):
        """Upload one or more files.

        :param str file_id_dest: Id representing a file/folder.
        :param list uploaded_files: List of uploaded files.

        :returns: A file object.
        :rtype: obj
        """
        fmgr = AgaveFileManager(self._ac)
        options = req_body['options']
        if options['type'] == '.jpg':
            accept_header = 'image/jpeg'
        elif options['type'] == 'blosc':
            accept_header = 'application/blosc'
        elif options['type'] == 'blosc-python':
            accept_header = 'application/blosc-python'

        req_header = {'Authorization': 'Token {}'.format(
            settings.NEURODATA_SUPER_TOKEN), "Accept": accept_header}
        req_url = 'https://api.boss.neurodata.io/v1/cutout/{}/{}/{}/{}/{}:{}/{}:{}/{}:{}/'.format(
            options['collection'],
            options['experiment'],
            options['channel'],
            options['resolution'],
            options['x_start'],
            options['x_stop'],
            options['y_start'],
            options['y_stop'],
            options['z_start'],
            options['z_stop']
        )

        resp = requests.get(req_url, headers=req_header)

        dest_id = options['targetSystem'] + options['targetPath']
        f = BytesIO(resp.content)
        f.name = options['filename']
        if options['type'] == '.jpg':
            f.name += '.jpg'
        fmgr.upload(dest_id, [f])
