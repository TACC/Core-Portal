"""Project views.

.. :module:: apps.projects.views
   :synopsis: Views to handle Projects
"""
import json
import logging
from django.http import HttpRequest, JsonResponse
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from portal.libs.agave.utils import service_account
from portal.utils import get_client_ip
from portal.utils.decorators import agave_jwt_login
from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView
from portal.apps.projects.managers.base import ProjectsManager
from portal.apps.projects.workspace_operations.shared_workspace_operations import \
        list_projects, get_project, create_shared_workspace, \
        update_project, get_workspace_role, change_user_role, add_user_to_workspace, \
        remove_user, transfer_ownership, increment_workspace_count
from portal.apps.search.tasks import tapis_project_listing_indexer
from portal.libs.elasticsearch.indexes import IndexedProject
from elasticsearch_dsl import Q
from portal.apps.projects.models.metadata import ProjectsMetadata
from portal.apps.projects.models.project_metadata import ProjectMetadata
from django.db import transaction
from portal.apps import SCHEMA_MAPPING
from django.db import models
from portal.apps.projects.workspace_operations.project_meta_operations import create_entity_metadata,  \
        create_project_metadata, get_ordered_value, move_entity, patch_entity_and_node, \
        patch_file_obj_entity, patch_project_entity
from portal.libs.agave.operations import mkdir
from pathlib import Path
from portal.apps._custom.drp import constants
from portal.apps.projects.workspace_operations.graph_operations import add_node_to_project, initialize_project_graph, get_node_from_path
from portal.apps.projects.tasks import process_file, sync_files_without_metadata
from portal.libs.files.file_processing import resize_cover_image
from django.http.multipartparser import MultiPartParser

LOGGER = logging.getLogger(__name__)
METRICS = logging.getLogger(f"metrics.{__name__}")

def validate_project_metadata(metadata):
    portal_name = settings.PORTAL_NAMESPACE
    schema = SCHEMA_MAPPING[constants.PROJECT]
    validated_model = schema.model_validate(metadata)
    return validated_model.model_dump(exclude_none=True)

@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(login_required, name='dispatch')
class ProjectsApiView(BaseApiView):
    """Projects API view.

    This view handles anything that has to do with multiple projects.
    Creating a project is implemented here since the call does not
    specify an id. Creating a project id takes into consideration the rest
    of the projects.
    """

    def get(self, request, root_system=None):
        """GET handler.

        If no 'query_string' is present this view will return a list of every
        project where the requesting user is a part of.
        If a `query_string` value is present (e.g.
        ``GET /api/projects/?query_string="vertigo"```) then the list of
        projects returned are the projects where the requesting user is a
        part of AND the query string is present in any of its fields.

        Sample response:
        ```json
        {"response": [{
            "id": "test.site.project.PROJECT-3",
            "name": 'PROJECT-3',
            "host": "cloud.data.tacc.utexas.edu",
            "updated": "2023-03-07T19:31:17.292220Z",
            "owner": {
            "username": 'username',
            "first_name": 'User',
            "last_name": 'Name',
            "email": 'user@username.com',
            },
            "title": "Test Project Title",
            "description": "Test Project Description"
        }, ... ],
        "status": 200
        }
        ```
        """

        query_string = request.GET.get('query_string')
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))

        METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.listing",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {},
            },
        )

        listing = []

        if query_string:
            search = IndexedProject.search()

            ngram_query = Q("query_string", query=query_string.lower(),
                            fields=["title", "id"],
                            minimum_should_match='100%',
                            default_operator='or')

            wildcard_query = Q("wildcard", title=f'*{query_string.lower()}*') | Q("wildcard", id=f'*{query_string.lower()}*')

            search = search.query(ngram_query | wildcard_query)
            search = search.extra(from_=int(offset), size=int(limit))

            res = search.execute()
            hits = [hit.id for hit in res if hasattr(hit, 'id') and hit.id is not None]
            listing = []
            # Filter search results to projects specific to user
            if hits:
                client = request.user.tapis_oauth.client
                listing = list_projects(client, root_system)
                filtered_list = filter(lambda prj: prj['id'] in hits, listing)
                listing = list(filtered_list)
        else:
            client = request.user.tapis_oauth.client
            listing = list_projects(client, root_system)

        for project in listing:
            try:
                project_meta = ProjectMetadata.objects.get(models.Q(value__projectId=project['id']))
                project.update(get_ordered_value(project_meta.name, project_meta.value))
                project["projectId"] = project['id']
            except ProjectMetadata.DoesNotExist:
                pass

        tapis_project_listing_indexer.delay(listing)

        return JsonResponse({"status": 200, "response": listing})

    @transaction.atomic
    def post(self, request):  # pylint: disable=no-self-use
        """POST handler."""
        title = request.POST.get('title')
        description = request.POST.get('description')
        metadata = request.POST.get('metadata')
        cover_image = request.FILES.get('cover_image')

        workspace_number = increment_workspace_count()
        system_id = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{settings.PORTAL_PROJECTS_ID_PREFIX}-{workspace_number}"

        if metadata is not None: 
            metadata = json.loads(metadata)

            if cover_image:
                metadata['cover_image'] = f'media/{settings.PORTAL_PROJECTS_ID_PREFIX}-{workspace_number}/cover_image/{cover_image.name}'

            metadata["projectId"] = system_id
            project_meta = create_project_metadata(metadata)
            initialize_project_graph(project_meta.project_id)

        client = request.user.tapis_oauth.client
        system_id = create_shared_workspace(client, title, request.user.username, description, workspace_number, tapis_tracking_id=f"portals.{request.session.session_key}")

        # Upload cover image to media folder
        if cover_image: 
            service_client = service_account()
            resized_file = resize_cover_image(cover_image)
            service_client.files.insert(systemId=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME, 
                                path=f'media/{settings.PORTAL_PROJECTS_ID_PREFIX}-{workspace_number}/cover_image/{cover_image.name}', 
                                file=resized_file)

        METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.create",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"body": data, "id": system_id},
            },
        )

        return JsonResponse(
            {
                'status': 200,
                'response': {"id": system_id}
            }
        )


@method_decorator(agave_jwt_login, name='dispatch')
class ProjectInstanceApiView(BaseApiView):
    """Project Instance API view.

    Any functionality pertaining to a single project instance should be
    implemented here, **unless** there is a more specific API view
    e.g. :class:`~portal.apps.projects.views.ProjectsPemsApiView`
    """

    def get(self, request, project_id=None, system_id=None):
        """Retrieve single project instance.

        A project instance can be retrieved by project or system id.

        :param request: Request object.
        :param str project_id: Project Id.
        :param str system_id: System Id.
        """
        # Based on url mapping, either system_id or project_id is always available.
        if system_id is not None:
            project_id = system_id.split(f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.")[1]
        
        if system_id and system_id.startswith(settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX):
            client = service_account()
        else:
            client = request.user.tapis_oauth.client

        prj = get_project(client, project_id)
        
        METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.detail",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"project_id": project_id},
            },
        )

        try: 
            project = ProjectMetadata.objects.get(models.Q(value__projectId=f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"))
            prj.update(get_ordered_value(project.name, project.value))
            prj["projectId"] = project_id

            if prj["cover_image"] is not None:
                service_client = service_account()

                if prj.get("is_published_project", False):
                    root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
                elif prj.get("is_review_project", False):
                    root_system = settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME
                else:
                    root_system = settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME

                postit = service_client.files.createPostIt(systemId=root_system, path=prj['cover_image'], allowedUses=-1,
                                                           validSeconds=86400)
                prj["cover_image_url"] = postit.redeemUrl

            if not getattr(prj, 'is_review_project', False) and not getattr(prj, 'is_published_project', False):
                sync_files_without_metadata.delay(client.access_token.access_token, f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}")
        except: 
            pass

        return JsonResponse(
            {
                'status': 200,
                'response': prj,
            }
        )

    @transaction.atomic
    def patch(
            self,
            request,
            project_id=None,
            system_id=None
    ):  # pylint: disable=no-self-use
        """Update one or multiple fields.

        This method should be used to update metadata values **mainly**.
        The updated values must live in the POST body of the request.

        .. example::
        POST data to update a project's title.
        ```json
        {
            "title": "New title"
        }
        ```
        POST data to update a project's title and description.
        ```json
        {
            "title": "New Title",
            "description": "New Description"
        }

        .. warning::
        This method will not update any team members on a project.
        That should be handled through permissions.

        :param request: Request object
        :param str project_id: Project Id.
        """
        query_dict, multi_value_dict = MultiPartParser(request.META, request, 
                                            request.upload_handlers).parse()
        
        title = query_dict.get('title')
        description = query_dict.get('description')
        metadata = query_dict.get('metadata')
        cover_image = multi_value_dict.get('cover_image')
        
        project_id_full = f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}"
        
        METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.patch",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"body": data},
            },
        )

        client = request.user.tapis_oauth.client

        workspace_def = update_project(client, project_id, title, description)

        if metadata is not None:
            metadata = json.loads(metadata)

            if cover_image:
                metadata['cover_image'] = f'media/{project_id}/cover_image/{cover_image.name}'
    
            entity = patch_project_entity(project_id_full, metadata)
            workspace_def.update(get_ordered_value(entity.name, entity.value))
            workspace_def["projectId"] = project_id
        
        # Upload cover image to media folder
        if cover_image: 
            service_client = service_account()
            resized_file = resize_cover_image(cover_image)
            service_client.files.insert(systemId=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME, 
                                path=f'media/{project_id}/cover_image/{cover_image.name}', 
                                file=resized_file)
            
            # Get the postit for the cover image
            postit = service_client.files.createPostIt(systemId=settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME, 
                                                       path=f'media/{project_id}/cover_image/{cover_image.name}',
                                                       allowedUses=-1, 
                                                       validSeconds=86400)
            workspace_def["cover_image_url"] = postit.redeemUrl

        return JsonResponse(
            {
                'status': 200,
                'response': workspace_def
            }
        )

@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(login_required, name='dispatch')
class ProjectMembersApiView(BaseApiView):
    """Project Members API view."""

    def patch(self, request, project_id):
        """PATCH handler.

        Process any action on a project
        """
        data = json.loads(request.body)
        action = data.get('action')
        try:
            operation = getattr(self, action.lower())
        except AttributeError:
            LOGGER.error(
                'Invalid action.',
                extra=request.POST.dict(),
                exc_info=True
            )
            raise ApiException(
                'Invalid action.',
                403,
                request.POST.dict()
            )

        METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.patchMembers",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"body": data},
            },
        )

        return operation(request, project_id, **data)

    def transfer_ownership(self, request, project_id, **data):
        old_pi = data.get('oldOwner')
        new_pi = data.get('newOwner')
        client = request.user.tapis_oauth.client
        res = transfer_ownership(client, project_id, new_pi, old_pi)
        return JsonResponse(
            {
                'status': 200,
                'response': res
            }
        )

    # pylint: disable=no-self-use
    def add_member(self, request, project_id, **data):
        """Add member to a project.
        In Shared Workspaces (CEPv2) members can only
        be added with "edit" access, which translates to co_pi
        """
        username = data.get('username')
        client = request.user.tapis_oauth.client
        resp = add_user_to_workspace(client, project_id, username)

        return JsonResponse(
            {
                'status': 200,
                'response': resp
            }
        )

    def remove_member(self, request, project_id, **data):
        """Remove member from project.

        :param request: Request object.
        :param str project_id: Project id.
        :param dict data: Data.
        """
        username = data.get('username')
        client = request.user.tapis_oauth.client
        resp = remove_user(client, project_id, username)

        return JsonResponse(
            {
                'status': 200,
                'response': resp
            }
        )

    def change_project_role(self, request, project_id, **data):
        username = data.get('username')
        old_role = data.get('oldRole')
        new_role = data.get('newRole')
        prj = ProjectsManager(request.user).change_project_role(
            project_id,
            username,
            old_role,
            new_role
        )

        return JsonResponse(
            {
                'status': 200,
                'response': prj.metadata,
            },
            encoder=ProjectsManager.meta_serializer_cls
        )

    def change_system_role(self, request, project_Id, **data):
        username = data.get('username')
        new_role = data.get('newRole')
        client = request.user.tapis_oauth.client

        role_map = {
            "GUEST": "reader",
            "USER": "writer"
        }
        change_user_role(client, project_Id, username, role_map[new_role])

        return JsonResponse(
            {
                'status': 200,
                'response': 'OK',
            }
        )


@login_required
def get_project_role(request, project_id, username):
    role = None
    client = request.user.tapis_oauth.client

    METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.get_project_role",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"project_id": project_id, "username": username},
            },
        )

    role = get_workspace_role(client, project_id, username)

    return JsonResponse({'username': username, 'role': role})


@login_required
def get_system_role(request, project_id, username):
    client = request.user.tapis_oauth.client

    METRICS.info(
            "Projects",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "projects.get_system_role",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"project_id": project_id, "username": username},
            },
        )

    role = get_workspace_role(client, project_id, username)

    return JsonResponse({'username': username, 'role': role})

class ProjectEntityView(BaseApiView):

    def patch(self, request: HttpRequest, project_id: str):
        
        client = request.user.tapis_oauth.client

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)
        
        req_body = json.loads(request.body)
        value = req_body.get("value", {})
        entity_uuid = req_body.get("uuid", "")
        path = req_body.get("path", "")
        updated_path = req_body.get("updatedPath", "")

        if value['data_type'] == 'file':
            try: 
                patch_file_obj_entity(client, project_id, value, path)
                if (len(value) > 1):
                    process_file.delay(project_id, path.lstrip("/"), client.access_token.access_token)
            except Exception as exc:
                raise ApiException("Error updating file metadata", status=500) from exc
        else:
            try:
                new_name = move_entity(client, project_id, path, updated_path, value, entity_uuid)
                patch_entity_and_node(project_id, value, path, updated_path, new_name, entity_uuid)
            except Exception as exc:
                raise ApiException("Error updating entity metadata", status=500) from exc

        return JsonResponse({"result": "OK"})


    def post(self, request: HttpRequest, project_id: str):
        """Add a new entity to a project"""

        client = request.user.tapis_oauth.client
        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)
    
        try:
            project: ProjectMetadata = ProjectMetadata.objects.get(
                models.Q(uuid=project_id) | models.Q(value__projectId=project_id)
            )
        except ProjectMetadata.DoesNotExist as exc:
            raise ApiException(
                "User does not have access to the requested project", status=403
            ) from exc

        req_body = json.loads(request.body)
        value = req_body.get("value", {})
        name = req_body.get("name", "")
        path = req_body.get("path", "")

        new_meta = create_entity_metadata(project_id, getattr(constants, name.upper()), {
            **value,
        })

        # FOR CREATING GRAPH
        parent_node = get_node_from_path(project_id, path)
        add_node_to_project(project_id, parent_node['id'], new_meta.uuid, new_meta.name, value['name'])

        # FOR CREATING DATA FILE FOLDER
        if (value and path):
            mkdir(client, project_id, path, value['name'])

        return JsonResponse({"result": "OK"})
    
