import json
import logging
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from requests.exceptions import HTTPError
from portal.apps.auth.tasks import get_user_storage_systems
from portal.views.base import BaseApiView
from portal.libs.agave.utils import service_account
from portal.apps.datafiles.handlers.tapis_handlers import (tapis_get_handler,
                                                           tapis_put_handler,
                                                           tapis_post_handler)
from portal.apps.users.utils import get_allocations
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.apps.datafiles.models import Link
from portal.exceptions.api import ApiException
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .utils import notify, NOTIFY_ACTIONS


logger = logging.getLogger(__name__)


METRICS = logging.getLogger('metrics.{}'.format(__name__))


class SystemListingView(BaseApiView):
    """System Listing View"""

    def get(self, request):
        portal_systems = settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
        local_systems = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS
        response = {'system_list': portal_systems}
        if request.user.is_authenticated:
            user_systems = get_user_storage_systems(request.user.username, local_systems)
            # compare available storage systems to the systems a user can access
            for system_name, details in user_systems.items():
                response['system_list'].append(
                    {
                        'name': details['name'],
                        'system':  UserSystemsManager(request.user, system_name=system_name).get_system_id(),
                        'scheme': 'private',
                        'api': 'tapis',
                        'icon': details['icon']
                    }
                )
            default_system = user_systems[settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT]
            response['default_host'] = default_system['host']
        return JsonResponse(response)


@method_decorator(login_required, name='dispatch')
class SystemDefinitionView(BaseApiView):
    """Get definitions for individual systems"""
    def get(self, request, systemId):
        return JsonResponse(request.user.agave_oauth.client.systems.get(systemId=systemId))


class TapisFilesView(BaseApiView):
    def get(self, request, operation=None, scheme=None, system=None, path='/'):
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            # Make sure that we only let unauth'd users see public systems
            if next(sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
                    if sys['system'] == system and sys['scheme'] == 'public'):
                client = service_account()
        try:
            METRICS.info("user:{} op:{} api:tapis scheme:{} "
                         "system:{} path:{}".format(request.user.username,
                                                    operation,
                                                    scheme,
                                                    system,
                                                    path))
            response = tapis_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())

            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except HTTPError as e:
            error_status = e.response.status_code
            error_json = e.response.json()
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            if error_status == 502:
                # In case of 502 determine cause
                system = dict(client.systems.get(systemId=system))
                allocations = get_allocations(request.user.username)

                # If user is missing an allocation mangle error to a 403
                if system['storage']['host'] not in allocations['hosts']:
                    e.response.status_code = 403
                    raise e

                # If a user needs to push keys, return a response specifying the system
                error_json['system'] = system
                return JsonResponse(error_json, status=error_status)
            raise e

        return JsonResponse({'data': response})

    def put(self, request, operation=None, scheme=None,
            handler=None, system=None, path='/'):
        body = json.loads(request.body)
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden

        try:
            METRICS.info("user:{} op:{} api:tapis scheme:{} "
                         "system:{} path:{} body:{}".format(request.user.username,
                                                            operation,
                                                            scheme,
                                                            system,
                                                            path,
                                                            body))
            response = tapis_put_handler(client, scheme, system, path, operation, body=body)
            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})

    def post(self, request, operation=None, scheme=None,
             handler=None, system=None, path='/'):
        body = request.FILES.dict()
        try:
            client = request.user.agave_oauth.client
        except AttributeError:
            return HttpResponseForbidden()

        try:
            METRICS.info("user:{} op:{} api:tapis scheme:{} "
                         "system:{} path:{} filename:{}".format(request.user.username,
                                                             operation,
                                                             scheme,
                                                             system,
                                                             path,
                                                             body['uploaded_file'].name))

            response = tapis_post_handler(client, scheme, system, path, operation, body=body)
            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})


@method_decorator(login_required, name='dispatch')
class LinkView(BaseApiView):
    def create_postit(self, request, scheme, system, path):
        client = request.user.agave_oauth.client
        body = {
            "url": "{tenant}/files/v2/media/system/{system}/{path}".format(
                tenant=settings.AGAVE_TENANT_BASEURL,
                system=system,
                path=path
            ),
            "unlimited": True
        }
        response = client.postits.create(body=body)
        postit = response['_links']['self']['href']
        link = Link.objects.create(
            agave_uri=f"{system}/{path}",
            postit_url=postit
        )
        link.save()
        return postit

    def delete_link(self, request, link):
        client = request.user.agave_oauth.client
        response = client.postits.delete(uuid=link.get_uuid())
        link.delete()
        return response

    def get(self, request, scheme, system, path):
        """Given a file, returns a link for a file
        """
        try:
            link = Link.objects.get(agave_uri=f"{system}/{path}")
        except Link.DoesNotExist:
            return JsonResponse({"data": None})
        return JsonResponse({"data": link.postit_url})

    def delete(self, request, scheme, system, path):
        """Delete an existing link for a file
        """
        try:
            link = Link.objects.get(agave_uri=f"{system}/{path}")
        except Link.DoesNotExist:
            raise ApiException("Post-it does not exist")
        response = self.delete_link(request, link)
        return JsonResponse({"data": response})

    def post(self, request, scheme, system, path):
        """Generates a new link for a file
        """
        try:
            Link.objects.get(agave_uri=f"{system}/{path}")
        except Link.DoesNotExist:
            # Link doesn't exist - proceed with creating one
            response = self.create_postit(request, scheme, system, path)
            return JsonResponse({"data": response})
        # Link for this file already exists, raise an exception
        raise ApiException("Link for this file already exists")

    def put(self, request, scheme, system, path):
        """Replace an existing link for a file
        """
        try:
            link = Link.objects.get(agave_uri=f"{system}/{path}")
            self.delete_link(request, link)
        except Link.DoesNotExist:
            raise ApiException("Could not find pre-existing link")
        response = self.create_postit(request, scheme, system, path)
        return JsonResponse({"data": response})
