"""
.. :module:: apps.data_depot.api.views
   :synopsys: Views to handle Data Depot API
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
import os
from django.http import JsonResponse
from django.conf import settings
from portal.apps.data_depot.api import lookups as LookupManager
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.accounts.managers.accounts import get_user_home_system_id

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name

def get_manager(request, file_mgr_name):
    fmgr_cls = LookupManager.lookup_manager(file_mgr_name)
    fmgr = fmgr_cls(request)
    if fmgr.requires_auth and not request.user.is_authenticated:
        raise ApiException("Login Required", status=403)
    return fmgr


class ProjectListingView(BaseApiView):
    """ Projects listing view"""
    def get(self, request):
        fmgr = get_manager(request, 'projects')
        projects = fmgr.projects_systems()
        return JsonResponse({'response': projects})


#TODO: Make this general!
class SystemListingView(BaseApiView):
    """System Listing View"""

    def get(self, request):
        community_data_system = settings.AGAVE_COMMUNITY_DATA_SYSTEM
        mydata_system = get_user_home_system_id(request.user)
        listing = [
            {
                "systemId": community_data_system,
                "name": "Community Data"
            },
            {
                "systemId": mydata_system,
                "name": "My Data"
            }
        ]
        return JsonResponse({'response': listing})

class ToolbarOptionsView(BaseApiView):

    def get(self, request):
        toolbar_options = settings.TOOLBAR_OPTIONS

        return JsonResponse({'response': toolbar_options})

class FileListingView(BaseApiView):
    """File Listing View"""

    def get(self, request, file_mgr_name, file_id, **kwargs):
        """GET Handles files listing"""

        METRICS.info('File Listing: file_mgr=%s, path=%s', file_mgr_name, file_id,
                     extra={'user': request.user.username,
                            'sessionId': request.session.session_key,
                            'operation': 'File Listing', 'info': ''})
        fmgr = get_manager(request, file_mgr_name)
        offset = kwargs.get('offset', 0)
        limit = kwargs.get('limit', 100)
        listing = fmgr.listing(file_id, offset=offset, limit=limit)
        return JsonResponse({'response': listing},
                            encoder=fmgr.encoder_cls)

class FileMediaView(BaseApiView):
    """File Media View"""

    ALLOWED_FILE_ACTIONS = [
                            'copy', 'download',
                            'mkdir', 'move', 'rename',
                            'trash', 'preview'
                           ]

    def get(self, request, file_mgr_name, file_id, **kwargs):
        """GET

        This method handles file downloads.

        :param request: Django request.
        :param str file_mgr_name: Manager name.
        :param str file_id: Id representation of a file.

        .. note:: We do not serve the files because we assume that
         files live in an external service, e.g. Agave, box, dropbox, etc...
         Usually, the response will contain a link directly to the file.
        """
        METRICS.info('Get File: file_mgr=%s, path=%s', file_mgr_name, file_id)
        fmgr = get_manager(request, file_mgr_name)
        preview = request.GET.get('preview', True)
        resp = fmgr.download(file_id, preview)
        return JsonResponse({'response': resp},
                            encoder=fmgr.encoder_cls)

    def post(self, request, file_mgr_name, file_id, **kwargs):
        """POST

        This method handles file uploads.

        :param request: Django request.
        :param str file_mgr_name: Manager name.
        :param str file_id: Id representation of a file.

        .. todo:: Implement folder uploads.
        """
        fmgr = get_manager(request, file_mgr_name)
        resp = fmgr.upload(file_id, [request.FILES['file']])
        return JsonResponse({'response': resp},
                            encoder=fmgr.encoder_cls)

    def delete(self, request, file_mgr_name, file_id, **kwargs):
        """DELETE"""
        fmgr = get_manager(request, file_mgr_name)
        fmgr.delete(file_id)
        return JsonResponse({'response': 'OK'})

    def put(self, request, file_mgr_name, file_id, **kwargs):
        """PUT

        Most of the file actions are routed through this method.
        The actions allowed are listed in :attr:`ALLOWED_FILE_ACTIONS`.

        .. rubric:: Rationale

        If the action is allowed then a method with the same name will
        be called. This means there will be a few methods in this class
        that map directly on to methods in a File Manager. By separating
        any action into methods read-ability is improved. Mostly because
        these view classes should take care of parse the request body
        correctly and *not* every method in a file manager can have
        the same type of signature.

        """
        fmgr = get_manager(request, file_mgr_name)
        if request.is_ajax():
            req_body = json.loads(request.body)
        else:
            req_body = request.POST.copy()

        action = req_body.get('action')
        operation = None
        if action not in self.ALLOWED_FILE_ACTIONS:
            raise ApiException("Invalid file action")

        try:
            operation = getattr(self, action)
        except AttributeError:
            raise ApiException("Invalid file action.")

        resp = operation(request, req_body, file_id, fmgr)
        return JsonResponse({'response': resp},
                            encoder=fmgr.encoder_cls)

    def copy(self, request, req_body, file_id, fmgr):
        """Copy action

        .. todo:: Take care of copy between systems.
        """
        dest_file_id = os.path.join(req_body.get('system'), req_body.get('path').lstrip('/'))
        return fmgr.copy(file_id, dest_file_id)

    def download(self, request, req_body, file_id, fmgr):
        """Download action"""
        return fmgr.download(file_id)

    def mkdir(self, request, req_body, file_id, fmgr):
        """Mkdir action"""
        return fmgr.mkdir(file_id, req_body['name'])

    def move(self, request, req_body, file_id, fmgr):
        """Move action"""
        dest_file_id = os.path.join(req_body.get('system'), req_body.get('path').lstrip('/'))
        return fmgr.move(file_id, dest_file_id)

    def rename(self, request, req_body, file_id, fmgr):
        """Rename action"""
        return fmgr.rename(file_id, req_body['name'])

    def trash(self, request, req_body, file_id, fmgr):
        """Trash action"""
        return fmgr.trash(file_id)

    def preview(self, request, req_body, file_id, fmgr):
        """Preview a file"""
        return fmgr.download(file_id, preview=True)

class FilePemsView(BaseApiView):
    """View to handle permissions operations"""
    def get(self, request, file_mgr_name, file_id, **kwargs):
        """GET"""
        METRICS.info('file_mgr_name=%s, file_id=%s', file_mgr_name, file_id,
                     extra=
                     {
                         'user': request.user.username,
                         'sessionId': request.session.session_key,
                         'operation': 'pems listing',
                         'info': ''
                     })
        fmgr = get_manager(request, file_mgr_name)
        pems = fmgr.pems(file_id, request.user.username)
        return JsonResponse({'response': pems},
                            encoder=fmgr.encoder_cls)
