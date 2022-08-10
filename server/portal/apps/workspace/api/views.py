"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
import logging
import json
from urllib.parse import urlparse
from datetime import timedelta
from operator import itemgetter
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.urls import reverse
from portal.apps.workspace.api import lookups as LookupManager
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.workspace.api.handlers.tapis_handlers import tapis_handler


logger = logging.getLogger(__name__)


def _tapis_response(request, view):
    try:
        client = request.user.agave_oauth.client
    except AttributeError:
        raise ApiException('This view requires authentication', status=403)

    operation = request.method.lower()
    user = request.user

    if operation == 'post':
        params = json.loads(request.body)
    else:
        params = request.GET.dict()

    return tapis_handler(client, user, operation, view, **params)

def get_manager(request, file_mgr_name):
    """Lookup Manager to handle call"""
    fmgr_cls = LookupManager.lookup_manager(file_mgr_name)
    fmgr = fmgr_cls(request)
    if fmgr.requires_auth and not request.user.is_authenticated:
        raise ApiException("Login Required", status=403)
    return fmgr


@method_decorator(login_required, name='dispatch')
class AppsView(BaseApiView):
    def get(self, request):
        response = _tapis_response(request, 'apps')
        return JsonResponse({'response': response})


@method_decorator(login_required, name='dispatch')
class MonitorsView(BaseApiView):
    def get(self, request):
        response = _tapis_response(request, 'monitors')
        return JsonResponse({'response': response})


@method_decorator(login_required, name='dispatch')
class MetadataView(BaseApiView):
    def get(self, request):
        response = _tapis_response(request, 'meta')
        return JsonResponse({'response': {'listing': response, 'default_tab': settings.PORTAL_APPS_DEFAULT_TAB}})

    def post(self, request):
        response = _tapis_response(request, 'meta')
        return JsonResponse({'response': response})

    def delete(self, request):
        meta_uuid = request.GET.get('uuid', None)
        if meta_uuid:
            response = _tapis_response(request, 'meta')
            return JsonResponse({'response': response})


@method_decorator(login_required, name='dispatch')
class JobsView(BaseApiView):
    def get(self, request):
        response = _tapis_response(request, 'jobs')
        return JsonResponse({'response': response})

    def post(self, request):
        response = _tapis_response(request, 'jobs')
        return JsonResponse({'response': response})

    def delete(self, request):
        response = _tapis_response(request, 'jobs')
        return JsonResponse({'response': response})


@method_decorator(login_required, name='dispatch')
class SystemsView(BaseApiView):
    def get(self, request):
        response = _tapis_response(request, 'systems')
        return JsonResponse({'response': response})

    def post(self, request):
        response = _tapis_response(request, 'systems')
        return JsonResponse({'response': response})


@method_decorator(login_required, name='dispatch')
class JobHistoryView(BaseApiView):
    def get(self, request, job_uuid):
        request.GET.set('job_uuid', job_uuid)
        response = _tapis_response(request, 'job_history')
        return JsonResponse({"response": response})


@method_decorator(login_required, name='dispatch')
class AppsTrayView(BaseApiView):

    def get(self, request):
        """
        Returns a structure containing app tray categories with metadata, and app definitions

        {
            "categories": {
                "Category 1": [
                    {
                        "label": "Jupyter",
                        "id": "jupyterhub",
                        "icon": "jupyter"
                        ...
                    }
                ]
            }
            "definitions": {
                "jupyterhub": { ... }
            }
        }
        """
        response = _tapis_response(request, 'apps_tray')
        tabs, definitions = itemgetter('a', 'b')(response)
        return JsonResponse({"tabs": tabs, "definitions": definitions})
