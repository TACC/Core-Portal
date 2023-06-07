import logging
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from portal.views.base import BaseApiView

logger = logging.getLogger(__name__)


@method_decorator(login_required, name='dispatch')
class TapisToken(BaseApiView):
    def get(self, request):
        if not request.user.profile.setup_complete:
            logger.warning(f"User '{request.user.username}' is attempting to get a Tapis token but setupComplete is False")
            raise PermissionDenied

        # By accessing client(), we ensure that that there is a non-expired access_token which can be immediately used
        _ = request.user.tapis_oauth.client

        logger.info(f"User '{request.user.username}' has retrieved their Tapis token")
        return JsonResponse({'token': request.user.tapis_oauth.access_token})
