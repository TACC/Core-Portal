from functools import wraps
from django.http import JsonResponse

def api_login_required(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated():
            return JsonResponse({"message": "Not authenticated"}, status=401)
        return view(request, *args, **kwargs)
    return wrapper

def staff_login_required(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated() or not request.user.is_staff:
            return JsonResponse({"message" : "Staff login required" }, status=401)
        return view(request, *args, **kwargs)
    return wrapper