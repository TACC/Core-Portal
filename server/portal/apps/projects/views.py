"""Project views.

.. :module:: apps.projects.views
   :synopsis: Views to handle Projects
"""
import json
import logging
from hashlib import sha256
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from portal.utils import get_client_ip
from portal.utils.decorators import agave_jwt_login
from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView
from portal.apps.projects.managers.base import ProjectsManager
from portal.apps.projects.workspace_operations.shared_workspace_operations import \
        list_projects, get_project, create_shared_workspace, \
        update_project, get_workspace_role, change_user_role, add_user_to_workspace, \
        remove_user, transfer_ownership
from portal.apps.search.tasks import tapis_project_listing_indexer
from portal.libs.elasticsearch.indexes import IndexedProject
from elasticsearch_dsl import Q

LOGGER = logging.getLogger(__name__)
METRICS = logging.getLogger(f"metrics.{__name__}")


@method_decorator(agave_jwt_login, name='dispatch')
@method_decorator(login_required, name='dispatch')
class ProjectsApiView(BaseApiView):
    """Projects API view.

    This view handles anything that has to do with multiple projects.
    Creating a project is implemented here since the call does not
    specify an id. Creating a project id takes into consideration the rest
    of the projects.
    """

    def get(self, request):
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

            ngram_query = Q("query_string", query=query_string,
                            fields=["title", "id"],
                            minimum_should_match='100%',
                            default_operator='or')

            wildcard_query = Q("wildcard", title=f'*{query_string}*') | Q("wildcard", id=f'*{query_string}*')

            search = search.query(ngram_query | wildcard_query)
            search = search.extra(from_=int(offset), size=int(limit))

            res = search.execute()
            hits = [hit.id for hit in res if hasattr(hit, 'id') and hit.id is not None]
            listing = []
            # Filter search results to projects specific to user
            if hits:
                client = request.user.tapis_oauth.client
                listing = list_projects(client)
                filtered_list = filter(lambda prj: prj['id'] in hits, listing)
                listing = list(filtered_list)
        else:
            client = request.user.tapis_oauth.client
            listing = list_projects(client)

        tapis_project_listing_indexer.delay(listing)

        return JsonResponse({"status": 200, "response": listing})

    def post(self, request):  # pylint: disable=no-self-use
        """POST handler."""
        data = json.loads(request.body)
        title = data['title']

        client = request.user.tapis_oauth.client
        session_key_hash = sha256((request.session.session_key or '').encode()).hexdigest()
        system_id = create_shared_workspace(client, title, request.user.username, tapis_tracking_id=f"portals.{session_key_hash}")

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
@method_decorator(login_required, name='dispatch')
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

        prj = get_project(request.user.tapis_oauth.client, project_id)

        return JsonResponse(
            {
                'status': 200,
                'response': prj,
            }
        )

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
        data = json.loads(request.body)

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
        workspace_def = update_project(client, project_id, data['title'], data['description'])
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
