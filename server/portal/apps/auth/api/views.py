"""API view for retrieving the current user's Tapis token."""

import logging
from hashlib import sha256
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from portal.views.base import BaseApiView

logger = logging.getLogger(__name__)


@method_decorator(login_required, name="dispatch")
class TapisToken(BaseApiView):
    """API view to retrieve the current user's Tapis token."""

    def get(self, request):
        """Get the current user's Tapis token and Tapis tenant base URL."""

        if not request.user.profile.setup_complete:
            logger.warning(
                "User '%s' is attempting get Tapis token but setupComplete is False",
                request.user.username,
            )
            raise PermissionDenied

        # By accessing client(), we ensure that there is a non-expired access_token which can be immediately used
        client = request.user.tapis_oauth.client
        session_key_hash = sha256(
            (request.session.session_key or "").encode()
        ).hexdigest()

        return JsonResponse(
            {
                "token": request.user.tapis_oauth.access_token,
                "baseUrl": client.base_url,
                "tapisTrackingId": f"portals.{session_key_hash}",
            }
        )
