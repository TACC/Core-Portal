"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
import logging
import json
from urllib.parse import urlparse
from datetime import timedelta
from more_itertools import one
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


def _tapis_response(request, view, additional_params=None):
    try:
        client = request.user.agave_oauth.client
    except AttributeError:
        raise ApiException('This view requires authentication', status=403)

    operation = request.method.lower()

    if operation == 'post':
        params = json.loads(request.body)
    else:
        params = request.GET.dict()

    if additional_params:
        for param in additional_params:
            first, *_ = param.items()
            (key, value) = first
            params[key] = value

    return tapis_handler(client, request, operation, view, **params)

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
        response = _tapis_response(request, 'job_history', [{'job_uuid': job_uuid}])
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
        tabs, definitions = _tapis_response(request, 'apps_tray')
        return JsonResponse({"tabs": tabs, "definitions": definitions})
