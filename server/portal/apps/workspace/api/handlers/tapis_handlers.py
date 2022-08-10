import json
from django.core.exceptions import PermissionDenied
import portal.apps.workspace.api.operations.tapis_v2 as operations

allowed_actions = {
    'apps': ['get'],
    'monitors': ['get'],
    'metadata': ['get', 'post', 'delete'],
    'jobs': ['get', 'post', 'delete'],
    'systems': ['get', 'post'],
    'jobs_history': ['get'],
    'apps_tray': ['get']
}

def tapis_handler(client, user, operation, view, **kwargs):
    if operation not in allowed_actions[view]:
        raise PermissionDenied

    operation = '{}_{}'.format(operation, view)
    op = getattr(operations, operation)
    return op(client, user, **kwargs)
