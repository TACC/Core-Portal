import logging
import json
from portal.apps.workspace.api.operations.tapis_v2 import (get_app,
                                                           get_app_listing,
                                                           get_monitors_listing,
                                                           get_metadata_listing,
                                                           get_metadata_query_listing,
                                                           get_job,
                                                           get_jobs_listing,
                                                           get_job_history,
                                                           get_systems_roles_listing,
                                                           get_systems_user_role,
                                                           get_apps_tray,
                                                           delete_job,
                                                           delete_metadata,
                                                           create_metadata,
                                                           update_metadata,
                                                           update_role,
                                                           resubmit_job,
                                                           submit_job
                                                           )


logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


def apps_get_handler(client, app_id, user, name, public_only):
    if app_id:
        METRICS.debug("user:{} is requesting app id:{}".format(user.username, app_id))
        return get_app(client, user, app_id)
    else:
        METRICS.debug("user:{} is requesting all public apps".format(user.username))
        return get_app_listing(client, public_only, name)

def monitors_get_handler(target):
    return get_monitors_listing(target)

def metadata_get_handler(client, app_id, user, query):
    if app_id:
        METRICS.debug("user:{} is requesting metadata for app id:{}".format(user.username, app_id))
        return get_metadata_listing(client, user, app_id)
    else:
        METRICS.debug("user:{} is requesting metadata for app with query".format(user.username))
        return get_metadata_query_listing(client, query)

def metadata_post_handler(client, meta_uuid, meta_post):
    if meta_uuid:
        del meta_post['uuid']
        return update_metadata(client, meta_uuid, meta_post)
    else:
        return create_metadata(client, meta_post)

def metadata_delete_handler(client, meta_uuid):
    return delete_metadata(client, meta_uuid)

def jobs_get_handler(client, user, job_id, limit, offset, period):
    if job_id:
        return get_job(client, user, job_id)
    else:
        return get_jobs_listing(client, user, limit, offset, period)

def jobs_delete_handler(client, job_id, user):
    METRICS.info("user:{} is deleting job id:{}".format(user.username, job_id))
    return delete_job(client, job_id)

def jobs_post_handler(client, user, job_post, job_id, job_action, request):
    if job_id and job_action:
        if job_action == 'resubmit':
            METRICS.info("user:{} is resubmitting job id:{}".format(user.username, job_id))
        # cancel job / stop job
        else:
            METRICS.info("user:{} is canceling/stopping job id:{}".format(user.username, job_id))

        return resubmit_job(client, user, job_action, job_id)
    # submit job
    elif job_post:
        METRICS.info("user:{} is submitting job:{}".format(request.user.username, job_post))
        return submit_job(client, user, job_post, request)

        # return JsonResponse({"response": response})

def systems_get_handler(user, roles, user_role, system_id):
    if roles:
        METRICS.info("user:{} agave.systems.listRoles system_id:{}".format(user.username, system_id))
        return get_systems_roles_listing(system_id)
    elif user_role:
        METRICS.info("user:{} agave.systems.getRoleForUser system_id:{}".format(user.username, system_id))
        return get_systems_user_role(system_id, user)

def systems_post_handler(user, system_id, role_body):
    METRICS.info("user:{} agave.systems.updateRole system_id:{}".format(user.username, system_id))
    return update_role(system_id, role_body)

def job_history_get_handler(client, job_uuid):
    return get_job_history(client, job_uuid)

def apps_tray_get_handler(user):
    return get_apps_tray(user)

