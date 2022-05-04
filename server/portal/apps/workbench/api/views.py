from django.conf import settings
from django.http import JsonResponse


def workbench_state(request):
    data = {
        'config': settings.WORKBENCH_SETTINGS,
        'portalName': settings.PORTAL_NAMESPACE,
        'recaptchaSiteKey': settings.RECAPTCHA_SITE_KEY
    }
    if request.user.is_authenticated:
        data['setupComplete'] = request.user.profile.setup_complete
    return JsonResponse({'response': data})
