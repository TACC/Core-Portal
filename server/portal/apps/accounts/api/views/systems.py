"""
.. :module:: portal.apps.accounts.api.views.systems
   :synopsis: Account's systems views
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
from future.utils import python_2_unicode_compatible
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from portal.views.base import BaseApiView
from portal.apps.accounts.managers import accounts as AccountsManager
from portal.apps.search.tasks import agave_indexer
from django.conf import settings
import json

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
# pylint: enable=invalid-name


@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
class SystemsListView(BaseApiView):
    """Systems View

    Main view for anything involving multiple systems
    """

    def get(self, request):
        """ GET """
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
        public_keys = request.GET.get('publicKeys', None)
        filter_prefix = json.loads(request.GET.get('filterPrefix', '{}'))
        response = {}

        storage_systems = AccountsManager.storage_systems(
            request.user,
            offset=offset,
            limit=limit
        )

        storage_systems = filter(
            lambda system: not system.id.startswith(settings.PORTAL_DATA_DEPOT_PROJECTS_SYSTEM_PREFIX),
            storage_systems
        )

        response['storage'] = storage_systems

        exec_systems = AccountsManager.execution_systems(
            request.user,
            offset=offset,
            limit=limit,
            filter_prefix=getattr(filter_prefix, 'execution', False)
        )
        response['execution'] = exec_systems
        if public_keys is not None:
            sys_ids = [sys.id for sys in storage_systems]
            sys_ids += [sys.id for sys in exec_systems]
            pub_keys = AccountsManager.public_key_for_systems(
                sys_ids
            )
            response['publicKeys'] = pub_keys

        return JsonResponse(
            {
                'response': response,
                'status': 200
            },
            encoder=AccountsManager.agave_system_serializer_cls
        )


@python_2_unicode_compatible
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


@python_2_unicode_compatible
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


@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
class SystemKeysView(BaseApiView):
    """Systems View

    Main view for anything involving a system test
    """

    def put(self, request, system_id):
        """PUT

        :param request: Django's request object
        :param str system_id: System id
        """
        body = json.loads(request.body)
        action = body['action']
        op = getattr(self, action)  # pylint: disable=invalid-name
        return op(request, system_id, body)

    # pylint: disable=no-self-use, unused-argument
    def reset(self, request, system_id, body):
        """Resets a system's set of keys

        :param request: Django's request object
        :param str system_id: System id
        """
        pub_key = AccountsManager.reset_system_keys(
            request.user.username,
            system_id
        )
        return JsonResponse({
            'systemId': system_id,
            'publicKey': pub_key
        })

    def push(self, request, system_id, body):
        """Pushed public key to a system's host

        :param request: Django's request object
        :param str system_id: System id
        """

        AccountsManager.reset_system_keys(
            request.user.username,
            system_id
        )

        success, result, http_status = AccountsManager.add_pub_key_to_resource(
            request.user.username,
            password=body['form']['password'],
            token=body['form']['token'],
            system_id=system_id,
            hostname=body['form']['hostname']
        )
        if success and body['form']['type'] == 'STORAGE':
            # Index the user's home directory once keys are successfully pushed.
            agave_indexer.apply_async(args=[system_id])
            return JsonResponse({
                'systemId': system_id,
                'message': 'OK'
            })

        return JsonResponse(
            {
                'systemId': system_id,
                'message': result
            },
            status=http_status
        )


@python_2_unicode_compatible
@method_decorator(login_required, name='dispatch')
class SystemRolesView(BaseApiView):
    """Systems Roles View

    View for system roles inspection
    """

    def get(self, request, system_id):
        client = request.user.agave_oauth.client
        data = client.systems.listRoles(systemId=system_id)
        return JsonResponse({"status": 200, "response": data})
