import logging
import json
from django.conf import settings
from portal.apps.workspace.api.operations.tapis_v2 import (get_app, get_applisting)


logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))

def apps_get_handler(client, app_id, user, name, public_only):
    if app_id:
        METRICS.debug("user:{} is requesting app id:{}".format(user.username, app_id))
        return get_app(client, user, app_id)
    else:
        METRICS.debug("user:{} is requesting all public apps".format(user.username))
        return get_applisting(client, public_only, name)

def monitor_get_handler():
    pass

def metadata_get_handler():
    pass

def metadata_post_handler():
    pass

def metadata_delete_handler():
    pass

def jobs_get_handler():
    pass

def jobs_delete_handler():
    pass

def jobs_post_handler():
    pass

def system_get_handler():
    pass

def system_post_handler():
    pass

def job_history_get_handler():
    pass

