from portal.apps.accounts.models import PortalProfile
from portal.apps.auth.tasks import check_user_allocations
from portal.views.base import BaseApiView
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse, HttpResponseForbidden
import json
import logging
from portal.apps.datafiles.handlers.tapis_handlers import (tapis_get_handler,
                                                           tapis_put_handler,
                                                           tapis_post_handler)

logger = logging.getLogger(__name__)


class SystemListingView(BaseApiView):
    """System Listing View"""

    def get(self, request):
        # gather local storage systems for My Data listing
        local_systems = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
        user_systems = check_user_allocations.apply_async(args=[request.user.username, local_systems]).get()

        response = {'system_list': []}
        for locsys, details in local_systems.items():
            if locsys in user_systems:
                response['system_list'].append(
                    {
                        'name': details['name'],
                        'system': details['prefix'].format(request.user.username),
                        'scheme': 'private',
                        'api': 'tapis',
                        'icon': details['icon']
                    }
                )

        return JsonResponse(response)


class TapisFilesView(BaseApiView):
    def get(self, request, operation=None, scheme=None, system=None, path='/'):
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            client = None

        response = tapis_get_handler(
            client, scheme, system, path, operation, **request.GET.dict())

        return JsonResponse({'data': response})

    def put(self, request, operation=None, scheme=None,
            handler=None, system=None, path='/'):

        body = json.loads(request.body)
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden

        response = tapis_put_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse({"data": response})

    def post(self, request, operation=None, scheme=None,
             handler=None, system=None, path='/'):
        body = request.FILES.dict()
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden()

        response = tapis_post_handler(client, scheme, system, path, operation, body=body)

        return JsonResponse({"data": response})
