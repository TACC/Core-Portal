from functools import wraps
from django.http import JsonResponse

def api_login_required(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated():
            return JsonResponse({"message": "Not authenticated"}, status=401)
        return view(request, *args, **kwargs)
    return wrapper
