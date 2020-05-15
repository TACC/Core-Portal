from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse


@login_required
def workbench_state(request):
    return JsonResponse({'debug': settings.DEBUG})
