import json
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from requests.exceptions import HTTPError
from portal.apps.auth.tasks import get_user_storage_systems
from portal.views.base import BaseApiView
from portal.apps.datafiles.handlers.tapis_handlers import (tapis_get_handler,
                                                           tapis_put_handler,
                                                           tapis_post_handler)
from portal.apps.users.utils import get_allocations
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.libs.agave.serializers import BaseAgaveSystemSerializer
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

        for system in response['system_list']:
            try:
                if system['api'] == 'tapis' and 'system' in system:
                    system['definition'] = StorageSystem(
                        request.user.agave_oauth.client, id=system['system']
                    )
            except Exception:
                logger.exception("Could not retrieve definition for {}".format(system['system']))

        return JsonResponse(response, encoder=BaseAgaveSystemSerializer)


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
