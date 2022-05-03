"""Project views.

.. :module:: apps.projects.views
   :synopsis: Views to handle Projects
"""
from __future__ import unicode_literals, absolute_import
import json
import logging
from future.utils import python_2_unicode_compatible
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from portal.utils.decorators import agave_jwt_login
from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView
from portal.apps.projects.managers.base import ProjectsManager
from django.contrib.auth import get_user_model
# from portal.apps.search.api.managers.project_search import ProjectSearchManager


LOGGER = logging.getLogger(__name__)


@python_2_unicode_compatible
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
            "absolutePath": "/corral-repl/tacc/aci/CEP/projects/CEP-7",
            "available": true,
            "default": false,
            "description": "Project Title",
            "globalDefault": false,
            "id": "cep.project.CEP-7",
            "name": "CEP-7",
            "owner": null,
            "public": false,
            "revision": null,
            "site": null,
            "status": "UP",
            "storage": {
                "auth": {
                    "password": null,
                    "privateKey": null,
                    "publicKey": null,
                    "type": null,
                    "username": null
                },
                "homeDir": null,
                "host": null,
                "mirror": false,
                "port": null,
                "protocol": null,
                "proxy": null,
                "publicAppsDir": null,
                "rootDir": null
            },
            "type": "STORAGE",
            "uuid": null
        }, ... ],
        "status": 200
        }
        ```
        """
        query_string = request.GET.get('query_string')
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))

        mgr = ProjectsManager(request.user)

        if query_string is not None:
            res = mgr.search(query_string=query_string,
                             offset=offset,
                             limit=limit)
        else:
            res = mgr.list(
                offset=offset,
                limit=limit
            )
        return JsonResponse(
            {
                'status': 200,
                'response': res
            },
            encoder=ProjectsManager.systems_serializer_cls
        )

    def post(self, request):  # pylint: disable=no-self-use
        """POST handler."""
        data = json.loads(request.body)
        title = data['title']
        members = data['members']
        mgr = ProjectsManager(request.user)
        prj = mgr.create(title)
        project_id = prj.project_id
        for member in members:
            try:
                if member['access'] == 'owner':
                    access = 'pi'
                elif member['access'] == 'edit':
                    access = 'team_member'
                else:
                    raise ApiException("Unsupported access level")
                mgr.add_member(
                    project_id,
                    access,
                    member['username']
                )
            except Exception:
                LOGGER.exception(
                    "Project was created, but could not add {username}", username=member['username']
                )
        return JsonResponse(
            {
                'status': 200,
                'response': prj.storage,
            },
            encoder=mgr.systems_serializer_cls
        )


@python_2_unicode_compatible
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
        mgr = ProjectsManager(request.user)
        prj = mgr.get_project(project_id, system_id)

        return JsonResponse(
            {
                'status': 200,
                'response': prj.metadata,
            },
            encoder=ProjectsManager.meta_serializer_cls
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
        mgr = ProjectsManager(request.user)
        data = json.loads(request.body)
        LOGGER.debug('data: %s', data)
        prj = mgr.update_prj(project_id, system_id, **data)
        return JsonResponse(
            {
                'status': 200,
                'response': prj.metadata
            },
            encoder=mgr.meta_serializer_cls
        )


@python_2_unicode_compatible
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
        return operation(request, project_id, **data)

    def transfer_ownership(self, request, project_id, **data):
        old_pi = data.get('oldOwner')
        new_pi = data.get('newOwner')
        res = ProjectsManager(request.user).transfer_ownership(
            project_id,
            old_pi,
            new_pi
        )
        return JsonResponse(
            {
                'status': 200,
                'response': res.metadata
            },
            encoder=ProjectsManager.meta_serializer_cls
        )

    # pylint: disable=no-self-use
    def add_member(self, request, project_id, **data):
        """Add member to a project.
        In Shared Workspaces (CEPv2) members can only
        be added with "edit" access, which translates to co_pi
        """
        username = data.get('username')
        res = ProjectsManager(request.user).add_member(
            project_id,
            'team_member',
            username
        )
        return JsonResponse(
            {
                'status': 200,
                'response': res.metadata
            },
            encoder=ProjectsManager.meta_serializer_cls
        )

    def remove_member(self, request, project_id, **data):
        """Remove member from project.

        :param request: Request object.
        :param str project_id: Project id.
        :param dict data: Data.
        """
        username = data.get('username')
        role = ProjectsManager(request.user).role_for_user(project_id, username)
        prj = ProjectsManager(request.user).remove_member(
            project_id=project_id,
            member_type=role,
            username=username
        )
        return JsonResponse(
            {
                'status': 200,
                'response': prj.metadata,
            },
            encoder=ProjectsManager.meta_serializer_cls
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
        prj = ProjectsManager(request.user).change_system_role(
            project_Id,
            username,
            new_role)

        return JsonResponse(
            {
                'status': 200,
                'response': prj.metadata,
            },
            encoder=ProjectsManager.meta_serializer_cls
        )


@login_required
def get_project_role(request, project_id, username):
    role = None
    mgr = ProjectsManager(request.user)
    role = mgr.role_for_user(project_id, username) 

    return JsonResponse({'username': username, 'role': role})


@login_required
def get_system_role(request, project_id, username):
    mgr = ProjectsManager(request.user)
    prj = mgr.get_project(project_id)
    role = prj.storage.roles.for_user(username).role
    return JsonResponse({'username': username, 'role': role})
