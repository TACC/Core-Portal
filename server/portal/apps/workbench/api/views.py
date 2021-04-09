from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse


@login_required
def workbench_state(request):
    data = {
        'setupComplete': request.user.profile.setup_complete,
        'config': settings.WORKBENCH_SETTINGS,
        'portalName': settings.PORTAL_NAMESPACE
    }
    return JsonResponse({'response': data})
