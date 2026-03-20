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
from tapipy.errors import BaseTapyException
from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials_with_keys, create_system_credentials
from portal.utils.encryption import createKeyPair

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
        """Pushed public key to a system's host

        :param request: Django's request object
        :param str system_id: System id
        """
        isTMSSystem = body['form']['isTMSSystem']
        if isTMSSystem:
            try:
                create_system_credentials(
                    request.user.client, body['form']['username'], system_id, createTmsKeys=True
                )
                http_status = 200
                result = 'OK'
            except BaseTapyException as e:
                logger.exception(
                    "System access check failed for user: %s on system: %s",
                    request.user.username,
                    system_id,
                )
                http_status = e.response.status_code
                result = e.message
        else:
            logger.info(f"Resetting credentials for user {request.user.username} on system {system_id}")
            (priv_key_str, publ_key_str) = createKeyPair()

            _, result, http_status = AccountsManager.add_pub_key_to_resource(
                request.user,
                username=body['form']['username'],
                password=body['form']['password'],
                token=body['form']['token'],
                system_id=system_id,
                pub_key=publ_key_str,
                hostname=body['form']['hostname'],
            )

            create_system_credentials_with_keys(request.user.tapis_oauth.client,
                                                request.user.username,
                                                publ_key_str,
                                                priv_key_str,
                                                system_id,
                                                loginUser=body['form']['username'])

        return JsonResponse(
            {
                'systemId': system_id,
                'message': result
            },
            status=http_status
        )
