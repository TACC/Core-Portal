from celery import shared_task
from portal.apps.data_depot.api import lookups as LookupManager

@shared_task()
def external_resource_revoke_shared_pems(file_mgr_name, revoke_method_name, username, file_id, permission_id):
    fmgr_cls = LookupManager.lookup_manager(file_mgr_name)
    revoke_method = getattr(fmgr_cls,revoke_method_name)
    revoke_method(username, file_id, permission_id)

# @shared_task()
# def external_resource_copy(request, file_mgr_name, file_id, dest_file_id):
#     fmgr_cls = LookupManager.lookup_manager(file_mgr_name)
#     fmgr = fmgr_cls(request)
#     fmgr.copy(file_id, dest_file_id)
