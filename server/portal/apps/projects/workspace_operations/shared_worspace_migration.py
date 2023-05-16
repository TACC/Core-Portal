"""
Migration scripts for bringing Shared Workspaces from V2 to V3.
"""
import requests
from django.conf import settings
from portal.apps.projects.models import ProjectMetadata
from portal.apps.projects.workspace_operations.shared_workspace_operations import create_workspace_system, add_user_to_workspace
from portal.libs.agave.utils import service_account

from portal.settings.settings_secret import _AGAVE_SUPER_TOKEN as v2_token
from portal.settings.settings_secret import _AGAVE_TENANT_BASEURL as v2_url

ROLE_MAP = {
    "USER": "writer",
    "ADMIN": "writer",
    "GUEST": "reader",
    "OWNER": None,
}

def get_role(project_id, username):
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"
    headers = {"Authorization": "Bearer {}".format(v2_token)}
    req = requests.get(f"{v2_url}/systems/v2/{system_id}/roles/{username}", headers=headers)
    if req.status_code != 200:
        return None
    
    return req.json()["result"]["role"]


def migrate_project(project_id):
    client = service_account()
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"
    
    v2_project = ProjectMetadata.objects.get(project_id=project_id)
    try:
        owner = v2_project.owner.username
    except AttributeError:
        owner = v2_project.pi.username

    create_workspace_system(client, project_id, v2_project.title, v2_project.description)

    for co_pi in v2_project.co_pis.all():
        v2_role = get_role(project_id, co_pi.username)
        v3_role = ROLE_MAP[v2_role]
        add_user_to_workspace(client, project_id, co_pi.username, v3_role)

    for team_member in v2_project.team_members.all():
        v2_role = get_role(project_id, team_member.username)
        v3_role = ROLE_MAP[v2_role]
        add_user_to_workspace(client, project_id, team_member.username, v3_role)

    client.systems.changeSystemOwner(systemId=system_id, userName=owner)


def migrate_all_projects():
    for prj in ProjectMetadata.objects.all():
        migrate_project(prj.project_id)