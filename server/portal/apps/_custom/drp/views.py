import json
from portal.views.base import BaseApiView
from django.conf import settings
from django.http import HttpRequest, JsonResponse, HttpResponseForbidden
from portal.exceptions.api import ApiException
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps.projects.schema_models import constants
import networkx as nx
from portal.apps.projects.workspace_operations.project_meta_operations import patch_file_obj_entity
from portal.apps.projects.tasks import process_file
from portal.apps.projects.views import get_project_client
import logging

logger = logging.getLogger(__name__)

class DigitalRocksSampleView(BaseApiView):

    def get(self, request):
        project_id = request.GET.get('project_id')
        get_origin_data = request.GET.get('get_origin_data')

        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        graph_model = ProjectMetadata.objects.get(
            name=constants.PROJECT_GRAPH, base_project__value__projectId=full_project_id
        )

        project_graph = nx.node_link_graph(graph_model.value)

        sample_uuids = []

        for node_id in list(project_graph.successors('NODE_ROOT')):
            node = project_graph.nodes[node_id]
            if (node.get('name') == constants.SAMPLE):
                sample_uuids.append(node.get('uuid'))
            
        samples = ProjectMetadata.objects.filter(uuid__in=sample_uuids).values('uuid', 'name', 'value')

        origin_data = []
        
        if get_origin_data == 'true':
            origin_data = ProjectMetadata.objects.filter(base_project__value__projectId=full_project_id, name=constants.DIGITAL_DATASET).values('uuid', 'name', 'value')

        response_data = {
            'samples': list(samples),
            'origin_data': list(origin_data)
        }

        return JsonResponse(response_data)
    


class GenerateImagesView(BaseApiView):
    """Save advanced image metadata for a project file and trigger image generation."""

    def post(self, request: HttpRequest):

        if not request.user.is_authenticated:
            raise ApiException("Unauthenticated user", status=401)

        client = get_project_client(request.user)

        req_body = json.loads(request.body)
        project_id = req_body.get("project_id", "")
        path = req_body.get("path", "")
        value = req_body.get("value", {})

        # Generating images implies the file is an advanced image file
        value["data_type"] = "file"
        value["is_advanced_image_file"] = True

        try:
            patch_file_obj_entity(client, project_id, value, path)
            process_file.delay(project_id, path.lstrip("/"), client.access_token.access_token, request.user.username)
        except Exception as exc:
            raise ApiException("Error generating images", status=500) from exc

        return JsonResponse({"result": "OK"})
    

