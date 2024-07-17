import json
from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from portal.apps.datafiles.models import DataFilesMetadata

class DigitalRocksSampleView(BaseApiView):

    def get(self, request):
        project_id = request.GET.get('project_id')
        get_origin_data = request.GET.get('get_origin_data')

        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        samples = DataFilesMetadata.objects.filter(project_id=full_project_id, metadata__data_type='sample').values('id', 'name', 'path', 'metadata')
        origin_data = []
        
        if get_origin_data == 'true':
            origin_data = DataFilesMetadata.objects.filter(project_id=full_project_id, metadata__data_type='origin_data').values('id', 'name', 'path', 'metadata')

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
    
    def get(self, request):

        metadata_data_types = ['sample', 'origin_data', 'analysis_data', 'file']

        project_id = request.GET.get('project_id')
        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        records = DataFilesMetadata.objects.filter(
                project_id=full_project_id,
                metadata__data_type__in=metadata_data_types
            ).order_by('created_at')

        tree = self.construct_tree(records)

        return JsonResponse(tree, safe=False)