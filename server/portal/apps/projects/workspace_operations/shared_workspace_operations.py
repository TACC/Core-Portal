# from portal.utils.encryption import createKeyPair
from portal.libs.agave.utils import service_account
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp import constants
from tapipy.tapis import Tapis
from typing import Literal
from django.db import transaction
from django.conf import settings
from django.contrib.auth import get_user_model
from portal.apps.projects.models.metadata import ProjectsMetadata
from django.db import models
from portal.apps.projects.workspace_operations.project_meta_operations import create_project_metadata, get_ordered_value
from portal.apps.onboarding.steps.system_access_v3 import create_system_credentials

import logging
logger = logging.getLogger(__name__)


def set_workspace_permissions(client: Tapis, username: str, system_id: str, role: str):
    """Apply read/write/execute permissions to a user on a system."""

    system_pems = {
         "reader": ["READ", "EXECUTE"],
         "writer": ["READ", "EXECUTE"]
    }

    files_pems = {
         "reader": "READ",
         "writer": "MODIFY"
    }

    logger.info(f"Adding {username} permissions to Tapis system {system_id}")
    client.systems.grantUserPerms(
        systemId=system_id,
        userName=username,
        permissions=system_pems[role])

    if role == "reader":
        client.systems.revokeUserPerms(systemId=system_id,
                                       userName=username,
                                       permissions=["MODIFY"])
        client.files.deletePermissions(systemId=system_id,
                                       path="/",
                                       username=username)

    client.files.grantPermissions(
        systemId=system_id,
        path="/",
        username=username,
        permission=files_pems[role]
    )


def set_workspace_acls(client, system_id, path, username, operation, role):

    operation_map = {
         "add": "ADD",
         "remove": "REMOVE"
    }

    acl_string_map = {
         "reader": f"d:u:{username}:rX,u:{username}:rX",
         "writer": f"d:u:{username}:rwX,u:{username}:rwX",
         "none": f"d:u:{username},u:{username}"
    }

    if settings.PORTAL_PROJECTS_USE_SET_FACL_JOB:
        logger.info(f"Using setfacl job to submit ACL change for project: {path}, username: {username}, operation: {operation}, role: {role}")
        job_res = submit_workspace_acls_job(username, path, role, operation)
        logger.info(f"Submitted workspace ACL job {job_res.name} with UUID {job_res.uuid}")
        return

    client.files.setFacl(systemId=system_id,
                         path=path,
                         operation=operation_map[operation],
                         recursionMethod="PHYSICAL",
                         aclString=acl_string_map[role])


def submit_workspace_acls_job(
    username, project_name, role, action=Literal["add", "remove"]
):
    """
    Submit a job to set ACLs on a project for a specific user. This should be used if
    we are setting ACLs on an existing project, since there might be too many files for
    the synchronous Tapis endpoint to be performant.
    """
    client = service_account()
    portal_name = settings.PORTAL_NAMESPACE

    job_body = {
        "name": f"setfacl-project-{project_name}-{username}-{action}-{role}",
        "appId": "setfacl-corral-wmaprtl",
        "appVersion": "0.0.1",
        "description": "Add/Remove ACLs on a directory",
        "fileInputs": [],
        "parameterSet": {
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "usernames", "value": username},
                {
                    "key": "directory",
                    "value": f"{settings.PORTAL_PROJECTS_ROOT_DIR}/{project_name}",
                },
                {"key": "action", "value": action},
                {"key": "role", "value": role},
            ],
        },
        "tags": [f"portalName:{portal_name}"],
    }
    res = client.jobs.submitJob(**job_body)
    return res


def create_workspace_dir(workspace_id: str, system_id=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME) -> str:
    client = service_account()
    path = f"{workspace_id}"
    client.files.mkdir(systemId=system_id, path=path)
    return path


def create_workspace_system(client, workspace_id: str, title: str, description="", owner=None, system_id=None, root_dir=None) -> str:
    system_id = system_id or f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    root_dir = root_dir or f"{settings.PORTAL_PROJECTS_ROOT_DIR}/{workspace_id}"

    system_args = {
        "id": system_id,
        "host": settings.PORTAL_PROJECTS_ROOT_HOST,
        "port": int(settings.PORTAL_PROJECTS_SYSTEM_PORT),
        "systemType": "LINUX",
        "defaultAuthnMethod": "PKI_KEYS",
        "canExec": False,
        "rootDir": root_dir,
        "effectiveUserId": settings.PORTAL_ADMIN_USERNAME,
        "authnCredential": {
            "privateKey": settings.PORTAL_PROJECTS_PRIVATE_KEY,
            "publicKey": settings.PORTAL_PROJECTS_PUBLIC_KEY
        },
        "notes": {"title": title, "description": description}
    }
    if owner:
        system_args["owner"] = owner
    client.systems.createSystem(**system_args)
    return system_id


def increment_workspace_count(force=None) -> int:
    client = service_account()
    root = settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME
    root_sys = client.systems.getSystem(systemId=root)
    new_count = int(root_sys.notes.count) + 1

    # Allow manual setting of the increment.
    if force:
        new_count = force

    client.systems.patchSystem(systemId=root,
                               notes={"count": new_count})
    return new_count


##########################################
# HIGH-LEVEL OPERATIONS TIED TO API ROUTES
##########################################


def create_shared_workspace(client: Tapis, title: str, owner: str, description="", predefind_workspace_number=None):
    """
    Create a workspace system owned by user whose client is passed.
    """
    service_client = service_account()
    force = predefind_workspace_number if predefind_workspace_number else None
    workspace_number = increment_workspace_count(force)
    workspace_id = f"{settings.PORTAL_PROJECTS_ID_PREFIX}-{workspace_number}"

    # Service client creates directory and gives owner write permissions
    create_workspace_dir(workspace_id)
    set_workspace_acls(service_client,
                       settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
                       workspace_id,
                       owner,
                       "add",
                       "writer")

    # User creates the system and adds their credential
    system_id = create_workspace_system(client, workspace_id, title, description)
    # priv_key, pub_key = createKeyPair()
    # register_public_key(owner,
    #                     pub_key,
    #                     system_id)
    # create_system_credentials(client, owner, pub_key, priv_key, system_id)
    # create_system_credentials(service_client,
    #                           settings.PORTAL_ADMIN_USERNAME,
    #                          settings.PORTAL_PROJECTS_PUBLIC_KEY,
    #                           settings.PORTAL_PROJECTS_PRIVATE_KEY,
    #                           system_id)

    return system_id


def add_user_to_workspace(client: Tapis,
                          workspace_id: str,
                          username: str,
                          role="writer",
                          system_id=None,
                          system_name=None):
    """
    Give a user POSIX and Tapis permissions on a workspace system.
    """
    service_client = service_account()
    system_id = system_id or f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    system_name = system_name or f"{settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME}"

    set_workspace_acls(service_client,
                       system_name,
                       workspace_id,
                       username,
                       "add",
                       role)

    # Code to generate/push user keys to a workspace
    # (uncomment to add per-user credentials)
    # priv_key, pub_key = createKeyPair()
    # register_public_key(username,
    #                     pub_key,
    #                     system_id)
    # create_system_credentials(client, username, pub_key, priv_key, system_id)

    # Share system to allow listing of users
    client.systems.shareSystem(systemId=system_id, users=[username])
    set_workspace_permissions(client, username, system_id, role)

    return get_project(client, workspace_id, system_id)


def change_user_role(client, workspace_id: str, username: str, new_role):
    """
    New role is one of ["reader", "writer"]
    """

    service_client = service_account()
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    set_workspace_acls(service_client,
                       settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
                       workspace_id,
                       username,
                       "add",
                       new_role)
    set_workspace_permissions(client, username, system_id, new_role)


def remove_user(client, workspace_id: str, username: str, system_id=None, system_name=None):
    """
    Unshare the system and remove all permissions and credentials.
    """

    service_client = service_account()
    system_id = system_id or f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    system_name = system_name or f"{settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME}"

    set_workspace_acls(service_client,
                       system_name,
                       workspace_id,
                       username,
                       "remove",
                       "none")
    client.systems.removeUserCredential(systemId=system_id, userName=username)
    client.systems.unShareSystem(systemId=system_id, users=[username])
    client.systems.revokeUserPerms(systemId=system_id,
                                   userName=username,
                                   permissions=["READ", "MODIFY", "EXECUTE"])
    client.files.deletePermissions(systemId=system_id,
                                   username=username,
                                   path="/")

    return get_project(client, workspace_id, system_id)


def transfer_ownership(client, workspace_id: str, new_owner: str, old_owner: str):
    """
    Set a new owner on a system.
    """
    service_client = service_account()
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    set_workspace_acls(service_client,
                       settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME,
                       workspace_id,
                       new_owner,
                       "add",
                       "writer")

    client.systems.changeSystemOwner(systemId=system_id, userName=new_owner)
    return get_project(client, workspace_id)


def update_project(client, workspace_id: str, title: str, description: str):
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    client.systems.patchSystem(systemId=system_id,
                               notes={"title": title,
                                      "description": description})

    return get_project(client, workspace_id)


def get_project_user(username):
    user_model = get_user_model()
    try:
        user = user_model.objects.get(username=username)
    except user_model.DoesNotExist:
        return {
            "username": username,
            "first_name": "",
            "last_name": "",
            "email": "",
        }

    return {
        "username": username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
    }


def list_projects(client, root_system_id=None):
    """
    List all workspace systems accessible to the user's client.
    """

    fields = "id,host,description,notes,updated,owner,rootDir"
    query = f"(id.like.{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.*)"

    if root_system_id:
        root_system = next(
            (system for system in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if system['system'] == root_system_id),
            None
        )
        if root_system:
            query += f"~(rootDir.like.{root_system['rootDir']}*)"

    # use limit as -1 to allow search to corelate with
    # all projects available to the api user
    listing = client.systems.getSystems(listType='ALL',
                                        search=query,
                                        select=fields,
                                        limit=-1)

    serialized_listing = map(lambda prj: {
        "id": prj.id,
        "path": prj.rootDir,
        "name": prj.id.split(f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.")[1],
        "host": prj.host,
        "updated": prj.updated,
        "owner": get_project_user(prj.owner),
        "title": getattr(prj.notes, "title", None),
        "description": getattr(prj.notes, "description", None)
    }, listing)
    return list(serialized_listing)


def get_project(client, workspace_id, system_id=None):
    system_id = system_id or f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    shares = client.systems.getShareInfo(systemId=system_id)
    system = client.systems.getSystem(systemId=system_id)

    users = [{"user": get_project_user(system.owner), "access": "owner"}]
    share_users = [u for u in shares.users if u != system.owner]
    for username in share_users:
        perms = client.files.getPermissions(systemId=system_id,
                                            path="/",
                                            username=username)
        if perms.permission == 'MODIFY':
            access = 'edit'
        elif perms.permission == 'READ':
            access = 'read'
        users.append({"user": get_project_user(username), "access": access})

    return {
        "title": getattr(system.notes, "title", None),
        "description": getattr(system.notes, "description", None),
        "created": system.created,
        "projectId": workspace_id,
        "members": users

    }


def get_workspace_role(client, workspace_id, username):
    system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{workspace_id}"
    system = client.systems.getSystem(systemId=system_id)
    if system.owner == username:
        return 'OWNER'

    perms = client.files.getPermissions(systemId=system_id,
                                        path="/",
                                        username=username)
    if perms.permission == 'MODIFY':
        return 'USER'

    if perms.permission == 'READ':
        return 'GUEST'

    return None

@transaction.atomic
def create_publication_workspace(client, source_workspace_id: str, source_system_id: str, target_workspace_id: str, 
                                 target_system_id: str, title: str, description="", is_review=False):
    
    portal_admin_username = settings.PORTAL_ADMIN_USERNAME
    service_client = service_account()

    # Determine workspace and system-specific settings based on the project type
    system_prefix = settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX if is_review else settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX
    root_system_name = settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME if is_review else settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    root_dir = settings.PORTAL_PROJECTS_REVIEW_ROOT_DIR if is_review else settings.PORTAL_PROJECTS_PUBLISHED_ROOT_DIR

    if is_review:
        # Add admin to the source workspace to allow for file copying
        add_user_to_workspace(client, source_workspace_id, portal_admin_username)

    # Retrieve the source project and adjust project data based on review/published status
    source_project = ProjectMetadata.get_project_by_id(source_system_id)
    project_value = get_ordered_value(constants.PROJECT, source_project.value)

    project_data = {
        **project_value,
        "project_id": target_system_id,
        "is_review_project": is_review,
        "is_published_project": not is_review
    }

    # Create and save the new project metadata
    new_project = create_project_metadata(project_data)
    new_project.save()

    # Set up the target workspace directory
    create_workspace_dir(target_workspace_id, root_system_name)

    # Configure workspace ACLs
    set_workspace_acls(service_client, root_system_name, target_workspace_id, portal_admin_username, "add", "writer")

    query = f"(id.eq.{target_system_id})"
    listing = service_client.systems.getSystems(listType='ALL', search=query, select="id,deleted",
                                            showDeleted=True, limit=-1)
    
    if listing and listing[0].deleted:
        service_client.systems.undeleteSystem(systemId=target_system_id)
        # Add back system credentials since the system was previously deleted
        create_system_credentials(service_client, portal_admin_username, settings.PORTAL_PROJECTS_PUBLIC_KEY, 
                                  settings.PORTAL_PROJECTS_PRIVATE_KEY, target_system_id)
    else:
    # Create the target workspace system
        create_workspace_system(
            service_client, target_workspace_id, title, description, None,
            f"{system_prefix}.{target_workspace_id}",
            f"{root_dir}/{target_workspace_id}"
        )
