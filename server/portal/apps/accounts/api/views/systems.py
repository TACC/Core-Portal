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
        offset = request.GET.get('offset', 0)
        limit = request.GET.get('limit', 100)
        public_keys = request.GET.get('publicKeys', None)
        response = {}
        storage_systems = AccountsManager.storage_systems(
            request.user,
            offset=offset,
            limit=limit
        )
        response['storage'] = storage_systems
        exec_systems = AccountsManager.execution_systems(
            request.user,
            offset=offset,
            limit=limit
        )
        response['execution'] = exec_systems
        if public_keys is not None:
            pub_keys = AccountsManager.public_key_for_systems(
                [sys.id for sys in storage_systems + exec_systems]
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
        result = AccountsManager.test_system(request.user, system_id)
        return JsonResponse(
            {
                'response': result,
                'status': 200
            }
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
        result = op(request, system_id, body)
        return JsonResponse(
            {
                'response': result,
                'status': 200
            }
        )

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
        return {
            'systemId': system_id,
            'publicKey': pub_key
        }

    def push(self, request, system_id, body):
        """Pushed public key to a system's host

        :param request: Django's request object
        :param str system_id: System id
        """
        AccountsManager.add_pub_key_to_resource(
            request.user.username,
            password=body['form']['password'],
            token=body['form']['token'],
            system_id=system_id,
            hostname=body['form']['hostname']
        )
        return {
            'system_id': system_id,
            'message': 'OK'
        }
