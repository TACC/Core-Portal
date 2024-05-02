from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from portal.apps.datafiles.models import DataFilesMetadata

class DigitalRocksSampleView(BaseApiView):

    def get(self, request):
        project_id = request.GET.get('project_id')
        get_origin_data = request.GET.get('get_origin_data')

        full_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'

        samples = DataFilesMetadata.objects.filter(project_id=full_project_id, metadata__data_type='sample').values('id', 'name', 'path')
        origin_data = []
        
        if get_origin_data == 'true':
            origin_data = DataFilesMetadata.objects.filter(project_id=full_project_id, metadata__data_type='origin_data').values('id', 'name', 'path', 'metadata')

        response_data = {
            'samples': list(samples),
            'origin_data': list(origin_data)
        }

        return JsonResponse(response_data)