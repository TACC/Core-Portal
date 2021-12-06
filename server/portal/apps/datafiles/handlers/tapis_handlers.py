from portal.libs.agave import operations
from django.core.exceptions import PermissionDenied
import logging


logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'search', 'copy', 'download', 'mkdir',
                'move', 'rename', 'trash', 'preview', 'upload', 'makepublic','delete'],
    'public': ['listing', 'search', 'copy', 'download', 'preview'],
    'community': ['listing', 'search', 'copy', 'download', 'preview'],
    'projects': ['listing', 'search', 'copy', 'download', 'mkdir',
                 'move', 'rename', 'trash', 'preview', 'upload', 'makepublic']
}


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
