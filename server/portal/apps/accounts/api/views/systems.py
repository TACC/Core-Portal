"""
.. :module:: portal.apps.accounts.api.views.systems
   :synopsis: Account's systems views
"""
import logging
import json
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from portal.views.base import BaseApiView
from portal.apps.accounts.managers import accounts as AccountsManager
from django.conf import settings
import json

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


@method_decorator(login_required, name='dispatch')
class SystemsListView(BaseApiView):
    """Systems View

    Main view for anything involving multiple systems
    """

    def get(self, request):
        """ GET """
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        filter_prefix = json.loads(request.GET.get('filterPrefix', '{}'))
        response = {}

        storage_systems = AccountsManager.storage_systems(
            request.user,
            offset=offset,
            limit=limit
        )

        storage_systems = [system for system in storage_systems if not system.id.startswith(settings.PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX)]

        response['storage'] = storage_systems

        exec_systems = AccountsManager.execution_systems(
            request.user,
            offset=offset,
            limit=limit,
            filter_prefix=getattr(filter_prefix, 'execution', False)
        )
        response['execution'] = exec_systems

        return JsonResponse(
            {
                'response': response,
                'status': 200
            },
            encoder=AccountsManager.agave_system_serializer_cls
        )


@method_decorator(login_required, name='dispatch')
class SystemView(BaseApiView):
    """Systems View

    Main view for anything involving one single system
    """

    def get(self, request, system_id):
        """GET"""
        system = AccountsManager.get_system(request.user, system_id)
        return JsonResponse(
            {
                'response': system,
                'status': 200
            },
            encoder=AccountsManager.agave_system_serializer_cls
        )


@method_decorator(login_required, name='dispatch')
class SystemTestView(BaseApiView):
    """Systems View

    Main view for anything involving a system test
    """

    def put(self, request, system_id):  # pylint: disable=no-self-use
        """PUT"""
        success, result = AccountsManager.test_system(
            request.user, system_id
        )
        if success:
            return JsonResponse(
                {
                    'response': result,
                    'status': 200
                }
            )

        return JsonResponse(
            {
                'response': result,
                'status': 500
            },
            status=500
        )


@method_decorator(login_required, name='dispatch')
class SystemRolesView(BaseApiView):
    """Systems Roles View

    View for system roles inspection
    """

    def get(self, request, system_id):
        client = request.user.agave_oauth.client
        data = client.systems.listRoles(systemId=system_id)
        return JsonResponse({"status": 200, "response": data})
