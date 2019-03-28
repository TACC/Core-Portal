"""Project views.

.. :module:: apps.projects.views
   :synopsis: Views to handle Projects
"""
from __future__ import unicode_literals, absolute_import
import json
import logging
from django.http import JsonResponse
from django.views.generic.base import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView
from portal.apps.projects.managers.base import ProjectsManager
from portal.apps.search.api.managers.project_search import ProjectSearchManager


LOGGER = logging.getLogger(__name__)


class ProjectsApiView(BaseApiView):
    """Projects API view.

    This view handles anything that has to do with multiple projects.
    Creating a project is implemented here since the call does not
    specify an id. Creating a project id takes into consideration the rest
    of the projects.
    """

    def get(self, request):
        """GET handler."""
        query_string = request.GET.get('query_string')
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))

        mgr = ProjectsManager(request.user)

        if query_string is not None:
            search_mgr = ProjectSearchManager(username=request.user.username, query_string=query_string)
            search_mgr.search(offset=offset, limit=limit)
            res = search_mgr.list(mgr=mgr)
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
        title = request.POST.get('title')
        mgr = ProjectsManager(request.user)
        prj = mgr.create(title)
        return JsonResponse(
            {
                'status': 200,
                'response': prj.storage,
            },
            encoder=mgr.systems_serializer_cls
        )


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

    # pylint: disable=no-self-use
    def add_member(self, request, project_id, **data):
        """Add member to a project."""
        username = data.get('username')
        member_type = data.get('memberType')
        res = ProjectsManager(request.user).add_member(
            project_id,
            member_type,
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
        member_type = data.get('memberType')
        prj = ProjectsManager(request.user).remove_member(
            project_id=project_id,
            member_type=member_type,
            username=username
        )
        return JsonResponse(
            {
                'status': 200,
                'response': prj.metadata,
            },
            encoder=ProjectsManager.meta_serializer_cls
        )
