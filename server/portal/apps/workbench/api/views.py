from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
import json
import os


@login_required
def workbench_state(request):
    with open(os.path.join(settings.BASE_DIR, 'libs/agave/fileTypes.json')) as f:
        file_types = json.load(f)
    data = {
        'setupComplete': request.user.profile.setup_complete,
        'config': settings.WORKBENCH_SETTINGS,
        'portalName': settings.PORTAL_NAMESPACE,
        'fileTypes': file_types
    }
    return JsonResponse({'response': data})
