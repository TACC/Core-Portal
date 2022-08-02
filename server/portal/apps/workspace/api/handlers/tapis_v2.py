from portal.libs.agave import operations
from django.core.exceptions import PermissionDenied
from portal.libs.agave.utils import service_account
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
import logging
logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload', 'makepublic', 'delete'],
    'public': ['listing', 'search', 'copy', 'download', 'preview'],
    'community': ['listing', 'search', 'copy', 'download', 'preview'],
    'projects': ['listing', 'search', 'copy', 'download', 'mkdir',
                 'move', 'rename', 'trash', 'preview', 'upload', 'makepublic']
}

# tapis_client(request.user.agave_oauth.client)
def tapis_client(request, system):
    try:
        client = request.user.agave_oauth.client
    except AttributeError:
        # Make sure that we only let unauth'd users see public systems
        if next(sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
                if sys['system'] == system and sys['scheme'] == 'public'):
            client = service_account()
        else:
            return HttpResponseForbidden
    return client


def tapis_get_handler(client, scheme, system, path, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(operations, operation)
    return op(client, system, path, **kwargs)


def tapis_post_handler(client, scheme, system,
                       path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied("")

    op = getattr(operations, operation)
    return op(client, system, path, **body)


def tapis_put_handler(client, scheme, system,
                      path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(operations, operation)

    return op(client, system, path, **body)
