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
from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials

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

    def push(self, request, system_id, body):
        """Create credentials for the system.

        :param request: Django's request object
        :param str system_id: System id
        """

        logger.info(f"Resetting credentials for user {request.user.username} on system {system_id}")

        create_system_credentials(request.user.tapis_oauth.client,
                                  request.user.username,
                                  system_id)

        return JsonResponse({'systemId': system_id, }, )
