
from django.conf import settings
from portal.libs.agave.utils import service_account
from portal.libs.agave.operations import iterate_listing
from portal.apps.projects.models.base import Project


def get_latest_project_storage(max_project_id=None):
    """Get latest agave project storage.

    :param max_project_id: If provided, then ignore projects ids that are greater than or equal to this value.
    """
    offset = 0
    limit = 1000
    latest = -1
    all_projects = []
    while True:
        prjs = [p for p in Project.listing(
            service_account(),
            offset=offset,
            limit=limit
        )]
        all_projects += prjs
        offset += limit
        if len(prjs) < limit:
            break

    for prj in all_projects:
        prj_id = prj.storage.id.replace(
            settings.PORTAL_PROJECTS_SYSTEM_PREFIX,
            ''
        )
        if '-' not in prj_id:
            continue
        prj_id = prj_id.rsplit('-')[-1]
        prj_id = int(prj_id)

        if prj_id > latest and (max_project_id is None or prj_id < max_project_id):
            latest = prj_id

    return latest


def get_latest_project_directory(max_project_id=None):
    """Get latest agave project directory.

    :param max_project_id: If provided, then ignore projects ids that are greater than or equal to this value.
    """
    latest = -1
    for f in iterate_listing(service_account(),
                             system=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
                             path='/'):
        name = f["name"]
        if '-' not in name or not name.startswith(settings.PORTAL_PROJECTS_ID_PREFIX):
            continue
        _, dir_id = name.rsplit('-', 1)
        dir_id = int(dir_id)
        if dir_id > latest and (max_project_id is None or dir_id < max_project_id):
            latest = dir_id
    return latest
