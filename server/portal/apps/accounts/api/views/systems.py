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

logger = logging.getLogger(__name__)


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
        op = getattr(self, action)
        return op(request, system_id, body)

    def reset(self, request, system_id, body):
        """Resets a system's set of keys

        :param request: Django's request object
        :param str system_id: System id
        """
        pub_key = AccountsManager.reset_system_keys(
            request.user,
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
            request.user,
            system_id,
            hostname=body['form']['hostname']
        )

        _, result, http_status = AccountsManager.add_pub_key_to_resource(
            request.user,
            password=body['form']['password'],
            token=body['form']['token'],
            system_id=system_id,
            hostname=body['form']['hostname']
        )

        return JsonResponse(
            {
                'systemId': system_id,
                'message': result
            },
            status=http_status
        )
