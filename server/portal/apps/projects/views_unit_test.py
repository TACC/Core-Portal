import pytest
from hashlib import sha256
from portal.apps.projects.managers.base import ProjectsManager
from portal.apps.search.tasks import tapis_project_listing_indexer
from portal.libs.elasticsearch.indexes import IndexedProject
from mock import MagicMock
import json
from tapipy.tapis import TapisResult
from django.conf import settings
from django.test import override_settings


@pytest.fixture
def mock_project_mgr(mocker):
    mocker.patch("portal.apps.projects.views.ProjectsManager.list")
    mocker.patch("portal.apps.projects.views.ProjectsManager.search")
    mocker.patch("portal.apps.projects.views.ProjectsManager.get_project")
    mocker.patch("portal.apps.projects.views.ProjectsManager.create")
    mocker.patch("portal.apps.projects.views.ProjectsManager.update_prj")
    mocker.patch("portal.apps.projects.views.ProjectsManager.add_member")
    mocker.patch("portal.apps.projects.views.ProjectsManager.remove_member")
    mocker.patch("portal.apps.projects.views.ProjectsManager.change_project_role")
    mocker.patch("portal.apps.projects.views.ProjectsManager.change_system_role")
    mocker.patch("portal.apps.projects.views.ProjectsManager.role_for_user")
    return ProjectsManager


@pytest.fixture()
def mock_service_account(mocker):
    return mocker.patch(
        "portal.apps.projects.workspace_operations.shared_workspace_operations.service_account"
    )


@pytest.fixture
def mock_project_search_indexer(mocker):
    mocker.patch("portal.apps.search.tasks.tapis_project_listing_indexer.delay")
    return tapis_project_listing_indexer


@pytest.fixture
def mock_project_index(mocker):
    mocker.patch("portal.libs.elasticsearch.indexes.IndexedProject.search")
    return IndexedProject


@pytest.fixture
def project_list(authenticated_user):
    return {
        "tapis_response": [
            TapisResult(
                **{
                    "id": f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.PRJ-123",
                    "rootDir": "/corral/tacc/aci/CEP/projects/CEP-1018",
                    "host": "cloud.data.tacc.utexas.edu",
                    "created": "2023-01-07T19:31:17.292220Z",
                    "updated": "2023-03-07T19:31:17.292220Z",
                    "owner": authenticated_user.username,
                    "notes": {"title": "Foo title", "description": "foo description"},
                }
            ),
            TapisResult(
                **{
                    "id": f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.PRJ-456",
                    "rootDir": "/corral/tacc/aci/CEP/projects/CEP-1018",
                    "host": "cloud.data.tacc.utexas.edu",
                    "created": "2023-01-07T19:31:17.292220Z",
                    "updated": "2023-03-07T19:31:17.292220Z",
                    "owner": authenticated_user.username,
                    "notes": {"title": "Bar title", "description": "bar description"},
                }
            ),
        ],
        "api_response": [
            {
                "description": "foo description",
                "host": "cloud.data.tacc.utexas.edu",
                "id": "test.project.PRJ-123",
                "name": "PRJ-123",
                "owner": {
                    "email": authenticated_user.email,
                    "first_name": authenticated_user.first_name,
                    "last_name": authenticated_user.last_name,
                    "username": authenticated_user.username,
                },
                "path": "/corral/tacc/aci/CEP/projects/CEP-1018",
                "title": "Foo title",
                "updated": "2023-03-07T19:31:17.292220Z",
            },
            {
                "description": "bar description",
                "host": "cloud.data.tacc.utexas.edu",
                "id": "test.project.PRJ-456",
                "name": "PRJ-456",
                "owner": {
                    "email": authenticated_user.email,
                    "first_name": authenticated_user.first_name,
                    "last_name": authenticated_user.last_name,
                    "username": authenticated_user.username,
                },
                "path": "/corral/tacc/aci/CEP/projects/CEP-1018",
                "title": "Bar title",
                "updated": "2023-03-07T19:31:17.292220Z",
            },
        ],
    }


def test_projects_get(
    authenticated_user,
    client,
    mock_tapis_client,
    mock_project_search_indexer,
    project_list,
):
    mock_tapis_client.systems.getSystems.return_value = [
        project_list["tapis_response"][0]
    ]

    client.force_login(authenticated_user)
    response = client.get("/api/projects/")

    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": [project_list["api_response"][0]],
    }
    fields = "id,host,description,notes,updated,owner,rootDir"
    query = f"id.like.{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.*"
    mock_tapis_client.systems.getSystems.assert_called_with(
        listType="ALL", search=query, select=fields, limit=-1
    )
    mock_project_search_indexer.delay.assert_called_with(
        [project_list["api_response"][0]]
    )


def test_projects_search(
    authenticated_user,
    client,
    mock_tapis_client,
    mock_project_index,
    mock_project_search_indexer,
    project_list,
):
    mock_project_index.search.return_value.query.return_value.extra.return_value.execute.return_value = [
        IndexedProject(**project_list["api_response"][1])
    ]
    mock_tapis_client.systems.getSystems.return_value = [
        project_list["tapis_response"][1]
    ]

    response = client.get("/api/projects/?query_string=bar")
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": [project_list["api_response"][1]],
    }
    mock_project_search_indexer.delay.assert_called_with(
        [project_list["api_response"][1]]
    )


def test_projects_search_result_not_in_tapis(
    client,
    mock_project_index,
    mock_project_search_indexer,
    project_list,
):
    mock_project_index.search.return_value.query.return_value.extra.return_value.execute.return_value = [
        IndexedProject(**project_list["api_response"][1])
    ]

    response = client.get("/api/projects/?query_string=bar")
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": []}
    mock_project_search_indexer.delay.assert_called_with([])


def test_projects_post(
    authenticated_user, client, mock_service_account, mock_tapis_client
):

    response = client.post(
        "/api/projects/",
        {
            "title": "Test Title",
            "description": "A test workspace",
            "keywords": "test1, test2, test3",
            "members": [{"username": authenticated_user.username, "access": "owner"}],
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {"id": "test.project.test.project-2"},
    }
    # 1. service account creates dir client.files.mkdir
    # 2. service account client sets client.files.setFacl
    # 3. standard client creates workspace client.systems.createSystem
    mock_service_account().files.mkdir.assert_called_with(
        systemId="projects.system.name",
        path="test.project-2",
        headers={
            "X-Tapis-Tracking-ID": f"portals.{sha256(client.session.session_key.encode()).hexdigest()}"
        },
    )
    mock_service_account().files.setFacl.assert_called_with(
        systemId="projects.system.name",
        path="test.project-2",
        operation="ADD",
        recursionMethod="PHYSICAL",
        aclString=f"d:u:{authenticated_user.username}:rwX,u:{authenticated_user.username}:rwX",
    )
    mock_tapis_client.systems.createSystem.assert_called()
    assert mock_tapis_client.systems.createSystem.call_args_list[0].contains(
        "test.project.test.project-2"
    )


@override_settings(PORTAL_PROJECTS_USE_SET_FACL_JOB=True)
def test_projects_post_setfacl_job(
    authenticated_user, client, mock_service_account, mock_tapis_client
):
    response = client.post(
        "/api/projects/",
        {
            "title": "Test Title",
            "description": "A test workspace",
            "keywords": "test1, test2, test3",
            "members": [{"username": authenticated_user.username, "access": "owner"}],
        },
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {"id": "test.project.test.project-2"},
    }
    # 1. service account creates dir client.files.mkdir
    # 2. service account client sets client.files.setFacl
    # 3. standard client creates workspace client.systems.createSystem
    mock_service_account().files.mkdir.assert_called_with(
        systemId="projects.system.name",
        path="test.project-2",
        headers={
            "X-Tapis-Tracking-ID": f"portals.{sha256(client.session.session_key.encode()).hexdigest()}"
        },
    )
    mock_service_account().files.setFacl.assert_not_called()
    mock_service_account().jobs.submitJob.assert_called_with(
        name="setfacl-project-projects.system.name-username-add-writer",
        appId="setfacl-corral-wmaprtl",
        appVersion="0.0.1",
        description="Add/Remove ACLs on a directory",
        fileInputs=[],
        parameterSet={
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "usernames", "value": "username"},
                {
                    "key": "directory",
                    "value": "/path/to/root/test.project-2",
                },
                {"key": "action", "value": "add"},
                {"key": "role", "value": "writer"},
            ],
        },
        tags=["portalName:test"],
    )
    mock_tapis_client.systems.createSystem.assert_called()
    assert mock_tapis_client.systems.createSystem.call_args_list[0].contains(
        "test.project.test.project-2"
    )


def test_project_instance_get_by_id(
    authenticated_user, client, mock_tapis_client, project_list
):
    mock_tapis_client.systems.getSystem.return_value = project_list["tapis_response"][0]
    mock_tapis_client.systems.getShareInfo.return_value = TapisResult(
        **{"users": [authenticated_user.username]}
    )

    response = client.get("/api/projects/PRJ-123/")
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {
            "title": project_list["api_response"][0]["title"],
            "description": project_list["api_response"][0]["description"],
            "keywords": None,
            "created": project_list["tapis_response"][0].created,
            "projectId": project_list["api_response"][0]["name"],
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                }
            ],
        },
    }


def test_project_instance_get_by_system(
    authenticated_user, client, mock_tapis_client, project_list
):
    mock_tapis_client.systems.getSystem.return_value = project_list["tapis_response"][0]
    mock_tapis_client.systems.getShareInfo.return_value = TapisResult(
        **{"users": [authenticated_user.username]}
    )

    response = client.get("/api/projects/system/test.project.PRJ-123/")
    assert response.status_code == 200

    assert response.json() == {
        "status": 200,
        "response": {
            "title": project_list["api_response"][0]["title"],
            "description": project_list["api_response"][0]["description"],
            "keywords": None,
            "created": project_list["tapis_response"][0].created,
            "projectId": project_list["api_response"][0]["name"],
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                }
            ],
        },
    }


def test_project_instance_patch(
    authenticated_user, client, mock_tapis_client, project_list
):
    updated_project = project_list["tapis_response"][0]
    updated_project.notes.title = "New Title"
    updated_project.notes.description = "new description"
    mock_tapis_client.systems.getSystem.return_value = updated_project
    mock_tapis_client.systems.getShareInfo.return_value = TapisResult(
        **{"users": [authenticated_user.username]}
    )

    response = client.patch(
        "/api/projects/PRJ-123/",
        json.dumps({"title": "New Title", "description": "new description", "keywords": None}),
    )

    mock_tapis_client.systems.patchSystem.assert_called_with(
        systemId="test.project.PRJ-123",
        notes={"title": "New Title", "description": "new description", "keywords": None},
    )

    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {
            "title": "New Title",
            "description": "new description",
            "keywords": None,
            "created": project_list["tapis_response"][0].created,
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                }
            ],
            "projectId": project_list["api_response"][0]["name"],
        },
    }


def test_project_change_role(client, mock_project_mgr, project_list):
    mock_project_mgr.change_project_role.return_value = MagicMock(
        metadata={"projectId": "PRJ-123"}
    )

    patch_body = {
        "action": "change_project_role",
        "username": "test_user",
        "oldRole": "co_pi",
        "newRole": "team_member",
    }

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))

    mock_project_mgr.change_project_role.assert_called_with(
        "PRJ-123", "test_user", "co_pi", "team_member"
    )
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": {"projectId": "PRJ-123"}}


def test_project_change_system_role(
    client, mock_service_account, mock_tapis_client, project_list
):
    # USER translates to writer role
    patch_body = {
        "action": "change_system_role",
        "username": "test_user",
        "newRole": "USER",
    }

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": "OK"}
    # System Id used in setFacl is project root system name
    mock_service_account().files.setFacl.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        operation="ADD",
        recursionMethod="PHYSICAL",
        aclString="d:u:test_user:rwX,u:test_user:rwX",
    )
    # Grant request are on the specific project system id
    mock_tapis_client.systems.grantUserPerms.assert_called_with(
        systemId="test.project.PRJ-123",
        userName="test_user",
        permissions=["READ", "EXECUTE"],
    )
    mock_tapis_client.files.grantPermissions.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        username="test_user",
        permission="MODIFY",
    )


@override_settings(PORTAL_PROJECTS_USE_SET_FACL_JOB=True)
def test_project_change_system_role_setfacl_job(
    client, mock_service_account, mock_tapis_client, project_list
):
    mock_rootDir = mock_tapis_client.systems.getSystem().rootDir

    # USER translates to writer role
    patch_body = {
        "action": "change_system_role",
        "username": "test_user",
        "newRole": "USER",
    }

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))
    assert response.status_code == 200
    assert response.json() == {"status": 200, "response": "OK"}
    # System Id used in setFacl is project root system name
    mock_service_account().files.setFacl.assert_not_called()
    mock_service_account().jobs.submitJob.assert_called_with(
        name="setfacl-project-test.project.PRJ-123-test_user-add-writer",
        appId="setfacl-corral-wmaprtl",
        appVersion="0.0.1",
        description="Add/Remove ACLs on a directory",
        fileInputs=[],
        parameterSet={
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "usernames", "value": "test_user"},
                {"key": "directory", "value": mock_rootDir},
                {"key": "action", "value": "add"},
                {"key": "role", "value": "writer"},
            ],
        },
        tags=["portalName:test"],
    )
    # Grant request are on the specific project system id
    mock_tapis_client.systems.grantUserPerms.assert_called_with(
        systemId="test.project.PRJ-123",
        userName="test_user",
        permissions=["READ", "EXECUTE"],
    )
    mock_tapis_client.files.grantPermissions.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        username="test_user",
        permission="MODIFY",
    )


def test_members_view_add(
    authenticated_user, client, mock_tapis_client, project_list, mock_service_account
):
    mock_tapis_client.systems.getSystem.return_value = project_list["tapis_response"][0]
    mock_tapis_client.systems.getShareInfo.return_value = TapisResult(
        **{"users": [authenticated_user.username, "test_user"]}
    )
    mock_tapis_client.files.getPermissions.return_value = TapisResult(
        **{"permission": "MODIFY"}
    )

    patch_body = {"action": "add_member", "username": "test_user"}

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))

    # All new members now have co_pi status since we no longer have distinctions
    # between members and co_pis, and an individual may not become a pi
    # until they have "edit" access (co_pi status)
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {
            "created": project_list["tapis_response"][0].created,
            "description": project_list["api_response"][0]["description"],
            "keywords": None,
            "projectId": "PRJ-123",
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                },
                {
                    "user": {
                        "username": "test_user",
                        "first_name": "",
                        "last_name": "",
                        "email": "",
                    },
                    "access": "edit",
                },
            ],
            "title": project_list["api_response"][0]["title"],
        },
    }

    mock_service_account().files.setFacl.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        operation="ADD",
        recursionMethod="PHYSICAL",
        aclString="d:u:test_user:rwX,u:test_user:rwX",
    )
    mock_tapis_client.systems.shareSystem.assert_called_with(
        systemId="test.project.PRJ-123", users=["test_user"]
    )
    mock_tapis_client.systems.grantUserPerms.assert_called_with(
        systemId="test.project.PRJ-123",
        userName="test_user",
        permissions=["READ", "EXECUTE"],
    )
    mock_tapis_client.files.grantPermissions.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        username="test_user",
        permission="MODIFY",
    )


@override_settings(PORTAL_PROJECTS_USE_SET_FACL_JOB=True)
def test_members_view_add_setfacl_job(
    authenticated_user, client, mock_service_account, mock_tapis_client, project_list
):
    mock_tapis_client.systems.getSystem.return_value = project_list["tapis_response"][0]
    mock_tapis_client.systems.getShareInfo.return_value = TapisResult(
        **{"users": [authenticated_user.username, "test_user"]}
    )
    mock_tapis_client.files.getPermissions.return_value = TapisResult(
        **{"permission": "MODIFY"}
    )

    patch_body = {"action": "add_member", "username": "test_user"}

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))

    # All new members now have co_pi status since we no longer have distinctions
    # between members and co_pis, and an individual may not become a pi
    # until they have "edit" access (co_pi status)
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {
            "created": project_list["tapis_response"][0].created,
            "description": project_list["api_response"][0]["description"],
            "keywords": None,
            "projectId": "PRJ-123",
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                },
                {
                    "user": {
                        "username": "test_user",
                        "first_name": "",
                        "last_name": "",
                        "email": "",
                    },
                    "access": "edit",
                },
            ],
            "title": project_list["api_response"][0]["title"],
        },
    }
    mock_service_account().files.setFacl.assert_not_called()
    mock_service_account().jobs.submitJob.assert_called_with(
        name="setfacl-project-test.project.PRJ-123-test_user-add-writer",
        appId="setfacl-corral-wmaprtl",
        appVersion="0.0.1",
        description="Add/Remove ACLs on a directory",
        fileInputs=[],
        parameterSet={
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "usernames", "value": "test_user"},
                {"key": "directory", "value": "/corral/tacc/aci/CEP/projects/CEP-1018"},
                {"key": "action", "value": "add"},
                {"key": "role", "value": "writer"},
            ],
        },
        tags=["portalName:test"],
    )
    mock_tapis_client.systems.shareSystem.assert_called_with(
        systemId="test.project.PRJ-123", users=["test_user"]
    )
    mock_tapis_client.systems.grantUserPerms.assert_called_with(
        systemId="test.project.PRJ-123",
        userName="test_user",
        permissions=["READ", "EXECUTE"],
    )
    mock_tapis_client.files.grantPermissions.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        username="test_user",
        permission="MODIFY",
    )


def test_members_view_remove(
    client, mock_service_account, mock_tapis_client, project_list
):
    mock_tapis_client.systems.getSystem.return_value = project_list["tapis_response"][0]
    patch_body = {"action": "remove_member", "username": "test_user"}

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {
            "created": project_list["tapis_response"][0].created,
            "description": project_list["api_response"][0]["description"],
            "projectId": "PRJ-123",
            "keywords": None,
            "title": project_list["api_response"][0]["title"],
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                }
            ],
        },
    }
    mock_service_account().files.setFacl.assert_called_with(
        systemId="test.project.PRJ-123",
        path="/",
        operation="REMOVE",
        recursionMethod="PHYSICAL",
        aclString="d:u:test_user,u:test_user",
    )
    mock_tapis_client.systems.unShareSystem.assert_called_with(
        systemId="test.project.PRJ-123", users=["test_user"]
    )
    mock_tapis_client.systems.revokeUserPerms.assert_called_with(
        systemId="test.project.PRJ-123",
        userName="test_user",
        permissions=["READ", "MODIFY", "EXECUTE"],
    )
    mock_tapis_client.files.deletePermissions.assert_called_with(
        systemId="test.project.PRJ-123", path="/", username="test_user"
    )


@override_settings(PORTAL_PROJECTS_USE_SET_FACL_JOB=True)
def test_members_view_remove_setfacl_job(
    client, mock_service_account, mock_tapis_client, project_list
):
    mock_tapis_client.systems.getSystem.return_value = project_list["tapis_response"][0]
    patch_body = {"action": "remove_member", "username": "test_user"}

    response = client.patch("/api/projects/PRJ-123/members/", json.dumps(patch_body))
    assert response.status_code == 200
    assert response.json() == {
        "status": 200,
        "response": {
            "created": project_list["tapis_response"][0].created,
            "description": project_list["api_response"][0]["description"],
            "projectId": "PRJ-123",
            "keywords": None,
            "title": project_list["api_response"][0]["title"],
            "members": [
                {
                    "user": {
                        "username": "username",
                        "first_name": "Firstname",
                        "last_name": "Lastname",
                        "email": "user@user.com",
                    },
                    "access": "owner",
                }
            ],
        },
    }
    mock_service_account().files.setFacl.assert_not_called()
    mock_service_account().jobs.submitJob.assert_called_with(
        name="setfacl-project-test.project.PRJ-123-test_user-remove-none",
        appId="setfacl-corral-wmaprtl",
        appVersion="0.0.1",
        description="Add/Remove ACLs on a directory",
        fileInputs=[],
        parameterSet={
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {"key": "usernames", "value": "test_user"},
                {"key": "directory", "value": "/corral/tacc/aci/CEP/projects/CEP-1018"},
                {"key": "action", "value": "remove"},
                {"key": "role", "value": "none"},
            ],
        },
        tags=["portalName:test"],
    )
    mock_tapis_client.systems.unShareSystem.assert_called_with(
        systemId="test.project.PRJ-123", users=["test_user"]
    )
    mock_tapis_client.systems.revokeUserPerms.assert_called_with(
        systemId="test.project.PRJ-123",
        userName="test_user",
        permissions=["READ", "MODIFY", "EXECUTE"],
    )
    mock_tapis_client.files.deletePermissions.assert_called_with(
        systemId="test.project.PRJ-123", path="/", username="test_user"
    )
