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
from portal.apps.onboarding.steps.system_access_v3 import (
    create_system_credentials_with_keys,
    create_system_credentials,
    create_system_credentials_with_password,
)
from portal.utils.encryption import createKeyPair
from portal.apps.datafiles.utils import evaluate_datafiles_storage_system

logger = logging.getLogger(__name__)


@method_decorator(login_required, name="dispatch")
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
        action = body["action"]
        op = getattr(self, action)
        return op(request, system_id, body)

    def push(self, request, system_id, body):
        """Pushed public key to a system's host

        :param request: Django's request object
        :param str system_id: System id
        """
        default_authn_method = body["form"]["defaultAuthnMethod"]
        client = request.user.tapis_oauth.client
        tapis_username = request.user.username
        login_username = body["form"]["username"]

        if default_authn_method == "TMS_KEYS":
            try:
                create_system_credentials(
                    client, login_username, system_id, createTmsKeys=True
                )
                http_status = 200
                result = "OK"
            except BaseTapyException as e:
                logger.exception(
                    "System access check failed for user: %s on system: %s",
                    tapis_username,
                    system_id,
                )
                http_status = e.response.status_code
                result = e.message
        elif default_authn_method == "PKI_KEYS":
            logger.info(
                f"Resetting credentials for user {tapis_username} on system {system_id}"
            )
            priv_key_str, publ_key_str = createKeyPair()

            success, result, http_status = AccountsManager.add_pub_key_to_resource(
                request.user,
                username=login_username,
                password=body["form"]["password"],
                token=body["form"]["token"],
                system_id=system_id,
                pub_key=publ_key_str,
                hostname=body["form"]["hostname"],
            )

            if not success:
                logger.error(
                    f"Failed to push keys for user {tapis_username} on system {system_id}: {result}"
                )
                return JsonResponse({"message": result}, status=http_status)

            create_system_credentials_with_keys(
                client,
                tapis_username,
                publ_key_str,
                priv_key_str,
                system_id,
                loginUser=login_username,
            )

        elif default_authn_method == "PASSWORD":
            try:
                create_system_credentials_with_password(
                    client,
                    tapis_username,
                    publ_key_str,
                    priv_key_str,
                    system_id,
                    loginUser=login_username,
                )
                http_status = 200
                result = "OK"
            except BaseTapyException as e:
                logger.exception(
                    "System credential creation failed for user: %s on system: %s",
                    tapis_username,
                    system_id,
                )
                http_status = e.response.status_code
                result = e.message

        tapis_system = client.systems.getSystem(systemId=system_id)

        portal_system = {
            "name": tapis_system.notes.get(
                "label", tapis_system.notes.get("title", tapis_system.id)
            ),
            "system": tapis_system.id,
            "scheme": "private",
            "api": "tapis",
            "icon": None,
            "default": False,
        }

        evaluated_system = evaluate_datafiles_storage_system(
            request.user.tapis_oauth, portal_system, default_host_eval="HOME"
        )

        return JsonResponse(
            {"system": evaluated_system, "message": result}, status=http_status
        )
