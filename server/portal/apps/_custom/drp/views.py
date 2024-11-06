import json
from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from portal.apps.datafiles.models import DataFilesMetadata
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp import constants
import networkx as nx
from networkx import shortest_path
from portal.apps.projects.workspace_operations.project_meta_operations import get_ordered_value
from portal.apps.projects.workspace_operations.graph_operations import remove_trash_nodes
class DigitalRocksSampleView(BaseApiView):

    def get(self, request):
        project_id = request.GET.get('project_id')
        get_origin_data = request.GET.get('get_origin_data')

        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        samples = ProjectMetadata.objects.filter(base_project__value__projectId=full_project_id, name=constants.SAMPLE).values('uuid', 'name', 'value')

        origin_data = []
        
        if get_origin_data == 'true':
            origin_data = ProjectMetadata.objects.filter(base_project__value__projectId=full_project_id, name=constants.DIGITAL_DATASET).values('uuid', 'name', 'value')

        response_data = {
            'samples': list(samples),
            'origin_data': list(origin_data)
        }

        return JsonResponse(response_data)
    
class DigitalRocksTreeView(BaseApiView):
        
    @staticmethod
    def _get_entity(uuid):
        return ProjectMetadata.objects.get(uuid=uuid)
    
    def get(self, request):

        project_id = request.GET.get('project_id')
        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        graph_model = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=full_project_id
        )

        graph = nx.node_link_graph(graph_model.value)

        graph = remove_trash_nodes(graph)

        for node_id in graph.nodes:

            node = graph.nodes[node_id]

            # Get the path from NODE_ROOT to the current node excluding the root
            if nx.has_path(graph, 'NODE_ROOT', node_id):
                path_nodes = shortest_path(graph, 'NODE_ROOT', node_id)[1:]
                node['path'] = '/'.join(graph.nodes[parent]['label'] for parent in path_nodes if 'label' in graph.nodes[parent])
            else:
                node['path'] = ""

            if node.get('value'):
                metadata = get_ordered_value(node['name'], node['value'])
                file_objs = node['value'].get('fileObjs', [])
            else:
                node_uuid = node.get("uuid")
                entity = self._get_entity(node_uuid)
                metadata = get_ordered_value(entity.name, entity.value)
                file_objs = entity.value.get('fileObjs', [])

            file_objs_dict = []

            for file_obj in file_objs:

                file_objs_dict.append({
                    **file_obj,
                    'id': file_obj.get('uuid'),
                    'metadata': get_ordered_value(constants.FILE, file_obj.get('value'))
                })

            node['metadata'] = metadata
            node['fileObjs'] = file_objs_dict

        tree = nx.tree_data(graph, "NODE_ROOT")

        return JsonResponse([tree], safe=False)
    

