"""
Migration scripts for bringing Shared Workspaces from V2 to V3.
"""
import requests
from django.conf import settings
from portal.apps.projects.models import LegacyProjectMetadata
from portal.apps.projects.workspace_operations.shared_workspace_operations import create_workspace_system, add_user_to_workspace
from portal.libs.agave.utils import service_account

from portal.settings.settings_secret import _AGAVE_SUPER_TOKEN as v2_token
from portal.settings.settings_secret import _AGAVE_TENANT_BASEURL as v2_url
from portal.settings import settings_custom
from django.core.exceptions import MultipleObjectsReturned
from tapipy.errors import NotFoundError, BaseTapyException

ROLE_MAP = {
    "USER": "writer",
    "ADMIN": "writer",
    "GUEST": "reader",
    "OWNER": "writer",
}


def get_role(project_id, username):
    system_id = f"{getattr(settings_custom, '_PORTAL_PROJECTS_SYSTEM_PREFIX_V2', settings.PORTAL_PROJECTS_SYSTEM_PREFIX)}.{project_id}"
    headers = {"Authorization": "Bearer {}".format(v2_token)}
    req = requests.get(f"{v2_url}/systems/v2/{system_id}/roles/{username}", headers=headers)
    if req.status_code != 200:
        return None

    return req.json()["result"]["role"]


def migrate_project(project_id):
    print(f'Beginning migration for project: {project_id}')
    client = service_account()
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"
    try:
        v2_project = LegacyProjectMetadata.objects.get(project_id=project_id)
    except MultipleObjectsReturned:
        print('FAILURE: more than 1 project with this ID')
        return

    try:
        owner = v2_project.owner.username
    except AttributeError:
        try:
            owner = v2_project.pi.username
        except AttributeError:
            print('No owner or PI specified')
            return

    try:
        create_workspace_system(client, project_id, v2_project.title, v2_project.description)
    except BaseTapyException as e:
        if 'SYSAPI_SYS_EXISTS' in e.message:
            print('A Tapis V3 workspace already exists for this system.')
        else:
            print('Error creating workspace system')
            print(e)
        return

    for co_pi in v2_project.co_pis.all():
        v2_role = get_role(project_id, co_pi.username)
        try:
            v3_role = ROLE_MAP[v2_role]
        except KeyError:
            print(f'ERROR: No role found for: {v2_role}')
            v3_role = "reader"
        try:
            add_user_to_workspace(client, project_id, co_pi.username, v3_role)
        except NotFoundError:
            print('ERROR: Workspace directory not found')
            return

    for team_member in v2_project.team_members.all():
        v2_role = get_role(project_id, team_member.username)
        try:
            v3_role = ROLE_MAP[v2_role]
        except KeyError:
            print(f'ERROR: No role found for: {v2_role}')
            v3_role = "reader"
        try:
            add_user_to_workspace(client, project_id, team_member.username, v3_role)
        except NotFoundError:
            print('ERROR: Workspace directory not found')
            return

    client.systems.changeSystemOwner(systemId=system_id, userName=owner)

    print(f'Successfully migrated project id: {project_id}')


def migrate_all_projects():
    for prj in LegacyProjectMetadata.objects.all():
        migrate_project(prj.project_id)
