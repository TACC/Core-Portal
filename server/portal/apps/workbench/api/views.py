from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse


@login_required
def workbench_state(request):
    data = {
        'setupComplete': request.user.profile.setup_complete
    }
    data.update({'config': settings.WORKBENCH_SETTINGS})
    return JsonResponse({'response': data})
