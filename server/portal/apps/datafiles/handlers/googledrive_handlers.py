from portal.libs.googledrive import operations
from django.core.exceptions import PermissionDenied
import logging


logger = logging.getLogger(__name__)

allowed_actions = {
    'private': ['listing', 'search', 'copy'],
    'public': [],
    'community': [],
}


def googledrive_get_handler(client, scheme, system, path, operation, **kwargs):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied
    op = getattr(operations, operation)
    return op(client, system, path, **kwargs)


def googledrive_put_handler(client, scheme, system,
                            path, operation, body=None):
    if operation not in allowed_actions[scheme]:
        raise PermissionDenied

    op = getattr(operations, operation)

    return op(client, system, path, **body)
