import json
import logging
import os
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.apps.users.utils import get_allocations
from portal.apps.auth.tasks import get_user_storage_systems
from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from requests.exceptions import HTTPError
from portal.views.base import BaseApiView
from portal.apps.datafiles.handlers.tapis_handlers import (tapis_get_handler,
                                                           tapis_put_handler,
                                                           tapis_post_handler)
from portal.apps.datafiles.handlers.googledrive_handlers import \
    (googledrive_get_handler,
     googledrive_put_handler)
from portal.libs.transfer.operations import transfer, transfer_folder
from portal.exceptions.api import ApiException
from .utils import notify, NOTIFY_ACTIONS

logger = logging.getLogger(__name__)


class SystemListingView(BaseApiView):
    """System Listing View"""

    def get(self, request):
        portal_systems = settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
        local_systems = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS

        user_systems = get_user_storage_systems(request.user.username, local_systems)
        # compare available storage systems to the systems a user can access
        response = {'system_list': []}
        for system_name, details in user_systems.items():
            response['system_list'].append(
                {
                    'name': details['name'],
                    'system':  UserSystemsManager(request.user, system_name=system_name).get_system_id(),
                    'scheme': 'private',
                    'api': 'tapis',
                    'icon': details['icon']
                }
            )
        response['system_list'] += portal_systems
        default_system = user_systems[settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT]
        response['default_host'] = default_system['host']

        return JsonResponse(response)


class TapisFilesView(BaseApiView):
    def get(self, request, operation=None, scheme=None, system=None, path='/'):
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            client = None
        try:
            response = tapis_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())

            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except HTTPError as e:
            error_status = e.response.status_code
            error_json = e.response.json()
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            if error_status == 502:
                # In case of 502 determine cause
                system = dict(client.systems.get(systemId=system))
                allocations = get_allocations(request.user.username)

                # If user is missing an allocation mangle error to a 403
                if system['storage']['host'] not in allocations['hosts']:
                    e.response.status_code = 403
                    raise e

                # If a user needs to push keys, return a response specifying the system
                error_json['system'] = system
                return JsonResponse(error_json, status=error_status)
            raise e

        return JsonResponse({'data': response})

    def put(self, request, operation=None, scheme=None,
            handler=None, system=None, path='/'):

        body = json.loads(request.body)
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden

        try:
            response = tapis_put_handler(client, scheme, system, path, operation, body=body)
            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})

    def post(self, request, operation=None, scheme=None,
             handler=None, system=None, path='/'):
        body = request.FILES.dict()
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden()

        try:
            response = tapis_post_handler(client, scheme, system, path, operation, body=body)
            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})


class GoogleDriveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme=None, system=None,
            path='root'):
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            raise ApiException("Login Required", status=400)
        try:
            response = googledrive_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
        except HTTPError as e:
            raise e

        return JsonResponse({'data': response})

    def put(self, request, operation=None, scheme=None,
            handler=None, system=None, path='root'):

        body = json.loads(request.body)
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        try:
            response = googledrive_put_handler(client, scheme, system, path,
                                               operation, body=body)
            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})


def get_client(user, api):
    client_mappings = {
        'tapis': 'agave_oauth',
        'shared': 'agave_oauth',
        'googledrive': 'googledrive_user_token',
        'box': 'box_user_token',
        'dropbox': 'dropbox_user_token'
    }
    return getattr(user, client_mappings[api]).client


class TransferFilesView(BaseApiView):
    def put(self, request, filetype):
        body = json.loads(request.body)

        src_client = get_client(request.user, body['src_api'])
        dest_client = get_client(request.user, body['dest_api'])

        try:
            if filetype == 'dir':
                transfer_folder(src_client, dest_client, **body)
            else:
                transfer(src_client, dest_client, **body)

            # Respond with tapis-like info for a toast notification
            file_info = {
                'nativeFormat': filetype,
                'name': body['dirname'],
                'path': os.path.join(body['dest_path_name'], body['dirname']),
                'systemId': body['dest_system']
            }
            notify(request.user.username, 'copy', 'success', {'response': file_info})
            return JsonResponse({'success': True})
        except Exception as exc:
            logger.info(exc)
            notify(request.user.username, 'copy', 'error', {})
            raise exc
