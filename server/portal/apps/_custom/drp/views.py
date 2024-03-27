from portal.views.base import BaseApiView
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from portal.apps.datafiles.models import DataFilesMetadata


class DigitalRocksSampleView(BaseApiView):

    def get(self, request):
        project_id = request.GET.get('project_id')
        get_origin_data = request.GET.get('get_origin_data')

        samples = DataFilesMetadata.objects.filter(project_id=f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}', metadata__data_type='sample').values('id', 'name', 'path')

        if get_origin_data:
            for sample in samples: 
                sample['origin_data'] = list(DataFilesMetadata.objects.filter(parent_id=sample['id'], metadata__data_type='origin_data').values('id', 'name', 'path'))

        print(f'SAMPLES RETRIEVED: {samples}')
        return JsonResponse(list(samples), safe=False)