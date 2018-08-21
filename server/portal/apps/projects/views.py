import logging
import json
from django.http import JsonResponse
from django.conf import settings
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import cache_control
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.projects.models import Project
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.models.systems.storage import StorageSystem
from portal import utils
from portal.decorators.api_authentication import api_login_required

logger = logging.getLogger(__name__)

@method_decorator(api_login_required, name='dispatch')
class ProjectInstanceView(BaseApiView):

    def get(self, request, project_uuid):
        logger.info("ProjectInstanceView")
        logger.info(project_uuid)
        ac = request.user.agave_oauth.client
        project = Project.fetch(ac, project_uuid)
        logger.info(project)
        return JsonResponse(project.to_dict())

    def put(self, request, project_uuid):
        """Can only update title and description for now, the
        other actions are handled by separate requests
        """
        post_data = json.loads(request.body)
        logger.info(post_data)
        ac = request.user.agave_oauth.client
        project = Project.fetch(ac, project_uuid)

        if project.pi != request.user.username:
            raise ApiException("Forbidden")
        project.title = post_data["value"]["title"]
        project.description = post_data["value"]["description"]
        project.save()
        logger.info(project)
        return JsonResponse(project.to_dict())


@method_decorator(api_login_required, name='dispatch')
class ProjectView(BaseApiView):
    """ Projects listing view"""
    cacher = cache_control(private=True, max_age=60*5)

    @method_decorator(cacher)
    def get(self, request):
        #TODO: fix this to work with the full metadata definition
        #of projects. For now, can just list the storage systems
        ac = request.user.agave_oauth.client
        systems = StorageSystem.search(
            ac,
            {
                'type.eq': "STORAGE",
                'id.like': '*-projects-*'
            }
        )
        # projects = Project.list_projects(agave_client=ac)
        # for p in projects:
        #     logger.info(p.to_dict())
        # out = [p.to_dict() for p in projects]
        return JsonResponse(systems, safe=False)

    def post(self, request):
        """
        Create a new Project. Projects and the root File directory for a Project should
        be owned by the portal, with roles/permissions granted to the creating user.

        1. Create the metadata record for the project
        2. Create a directory on the projects storage system named after the metadata uuid
        3. Associate the metadata uuid and file uuid

        :param request:
        :return: The newly created project
        :rtype: JsonResponse
        """

        # portal service account needs to create the objects on behalf of the user
        ag = utils.agave.get_service_account_client()

        if request.is_ajax():
            post_data = json.loads(request.body)
        else:
            post_data = request.POST.copy()

        prj = Project(ag)
        prj.pi = request.user.username
        prj.pi_name = u"{fn} {ln}".format(fn=request.user.first_name, ln=request.user.last_name)
        prj.title = post_data.get('title')
        prj.award_number = post_data.get('awardNumber', '')
        prj.project_type = post_data.get('projectType', '')
        prj.associated_projects = post_data.get('associatedProjects', {})
        prj.description = post_data.get('description', '')
        prj.keywords = post_data.get('keywords', '')
        prj.project_id = post_data.get('projectId', '')
        prj.save()

        mngr = BaseFile(ag, Project.STORAGE_SYSTEM_ID, '/')
        mngr.mkdir(prj.uuid)

        #
        # # Wrap Project Directory as private system for project
        # project_system_tmpl = template_project_storage_system(prj)
        # project_system_tmpl['storage']['rootDir'] = \
        #     project_system_tmpl['storage']['rootDir'].format(project_uuid)
        #
        # ag.systems.add(body=project_system_tmpl)
        #
        #
        # prj.add_team_members([request.user.username])

        return JsonResponse(prj.to_dict(), safe=False)
