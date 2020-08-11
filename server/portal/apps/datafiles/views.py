from portal.views.base import BaseApiView
from django.http import JsonResponse, HttpResponseForbidden
from django.conf import settings
from requests.exceptions import HTTPError
import json
import logging
from portal.apps.accounts.managers.accounts import get_user_home_system_id
from portal.apps.datafiles.handlers.tapis_handlers import (tapis_get_handler,
                                                           tapis_put_handler,
                                                           tapis_post_handler)

logger = logging.getLogger(__name__)


class SystemListingView(BaseApiView):
    """System Listing View"""

    def get(self, request):
        community_data_system = settings.AGAVE_COMMUNITY_DATA_SYSTEM
        public_data_system = settings.AGAVE_PUBLIC_DATA_SYSTEM
        mydata_system = get_user_home_system_id(request.user)

        response = {
            'private': mydata_system,
            'community': community_data_system,
            'public': public_data_system
        }

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
