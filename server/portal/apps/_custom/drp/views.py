import json
from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from portal.apps.datafiles.models import DataFilesMetadata
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp import constants
import networkx as nx
class DigitalRocksSampleView(BaseApiView):

    def get(self, request):
        project_id = request.GET.get('project_id')
        get_origin_data = request.GET.get('get_origin_data')

        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        # samples = DataFilesMetadata.objects.filter(project_id=full_project_id, metadata__data_type='sample').values('id', 'name', 'path', 'metadata')

        samples = ProjectMetadata.objects.filter(base_project__value__projectId=full_project_id, name=constants.SAMPLE).values('uuid', 'name', 'value')

        origin_data = []
        
        if get_origin_data == 'true':
            # origin_data = DataFilesMetadata.objects.filter(project_id=full_project_id, metadata__data_type='origin_data').values('id', 'name', 'path', 'metadata')

            origin_data = ProjectMetadata.objects.filter(base_project__value__projectId=full_project_id, name=constants.ORIGIN_DATA).values('uuid', 'name', 'value')

        response_data = {
            'samples': list(samples),
            'origin_data': list(origin_data)
        }

        return JsonResponse(response_data)
    
class DigitalRocksTreeView(BaseApiView):

    @staticmethod
    def construct_tree(records, parent_id=None):
        tree = []
        for record in records:
            if record.parent_id == parent_id:
                node_dict = {
                    "id": record.id,
                    "name": record.name,
                    "path": record.path,
                    "metadata": record.ordered_metadata,
                    "children": DigitalRocksTreeView.construct_tree(records, record.id)
                }
                tree.append(node_dict)
        return tree
        
    @staticmethod
    def _get_entity(uuid):
        return ProjectMetadata.objects.get(uuid=uuid)
    
    def get(self, request):

        metadata_data_types = ['sample', 'origin_data', 'analysis_data', 'file']

        project_id = request.GET.get('project_id')
        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        graph_model = ProjectMetadata.objects.get(
        name=constants.PROJECT_GRAPH, base_project__value__projectId=full_project_id
        )

        graph = nx.node_link_graph(graph_model.value)

        for node in graph.nodes:
            node_uuid = graph.nodes[node].get("uuid")

            entity = self._get_entity(node_uuid)
            metadata = entity.ordered_value

            file_objs = entity.value.get('fileObjs', [])

            file_objs_dict = []

            for file_obj in file_objs:
                file_obj_entity = self._get_entity(file_obj.get('uuid'))
                file_obj_metadata = file_obj_entity.ordered_value

                file_objs_dict.append({
                    **file_obj,
                    'metadata': file_obj_metadata
            })
                
            graph.nodes[node]['metadata'] = metadata
            graph.nodes[node]['fileObjs'] = file_objs_dict

        tree = nx.tree_data(graph, "NODE_ROOT")

        return JsonResponse([tree], safe=False)
    

