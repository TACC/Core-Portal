import json
import logging
from portal.apps.users.utils import get_allocations
from django.conf import settings
from django.http import JsonResponse, HttpResponseForbidden
from requests.exceptions import HTTPError
from tapipy.errors import InternalServerError, UnauthorizedError
from portal.views.base import BaseApiView
from portal.libs.agave.utils import service_account
from portal.apps.datafiles.handlers.tapis_handlers import (tapis_get_handler,
                                                           tapis_put_handler,
                                                           tapis_post_handler)
from portal.apps.datafiles.handlers.googledrive_handlers import \
    (googledrive_get_handler,
     googledrive_put_handler)
from portal.libs.transfer.operations import transfer, transfer_folder
from portal.libs.agave.serializers import BaseTapisResultSerializer
from portal.exceptions.api import ApiException
from portal.apps.datafiles.models import Link
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.utils.decorators import method_decorator
from portal.apps.users.utils import get_user_data
from .utils import notify, NOTIFY_ACTIONS
import dateutil.parser

logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


class SystemListingView(BaseApiView):
    """System Listing View"""

    def get(self, request):
        portal_systems = settings.PORTAL_DATAFILES_STORAGE_SYSTEMS

        response = {}
        if request.user.is_authenticated:

            # Evaluate user home dir via TAS
            username = request.user.username
            tasdir = get_user_data(username)['homeDirectory']
            response['system_list'] = [
                {
                    **system,
                    'homeDir': system['homeDir'].format(tasdir=tasdir, username=username)
                }
                if 'homeDir' in system else system for system in portal_systems
            ]

            default_system = settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM or settings.PORTAL_DATAFILES_STORAGE_SYSTEMS[0]
            if default_system:
                system_id = default_system.get('system')
                system_def = request.user.tapis_oauth.client.systems.getSystem(systemId=system_id, select='host')
                response['default_host'] = system_def.host
                response['default_system'] = system_id
        else:
            response['system_list'] = [sys for sys in portal_systems if sys['scheme'] == 'public']

        return JsonResponse(response)


class SystemDefinitionView(BaseApiView):
    """Get definitions for individual systems"""

    def get(self, request, systemId):
        try:
            client = request.user.tapis_oauth.client
        except AttributeError:
            # Make sure that we only let unauth'd users see public systems
            public_sys = next((sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if sys['scheme'] == 'public'), None)
            if public_sys and public_sys['system'] == systemId:
                client = service_account()
            else:
                return JsonResponse({'message': 'Unauthorized'}, status=401)
        system_def = client.systems.getSystem(systemId=systemId)
        return JsonResponse(
            {
                "status": 200,
                "response": system_def
            },
            encoder=BaseTapisResultSerializer
        )


class TapisFilesView(BaseApiView):
    def get(self, request, operation=None, scheme=None, system=None, path='/'):
        try:
            client = request.user.tapis_oauth.client
        except AttributeError:
            # Make sure that we only let unauth'd users see public systems
            public_sys = next((sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS if sys['scheme'] == 'public'), None)
            if public_sys and public_sys['system'] == system and path.startswith(public_sys['homeDir'].strip('/')):
                client = service_account()
            else:
                return JsonResponse(
                    {'message': 'This data requires authentication to view.'},
                    status=403)
        try:
            METRICS.info("user:{} op:{} api:tapis scheme:{} "
                         "system:{} path:{} filesize:{}".format(request.user.username,
                                                                operation,
                                                                scheme,
                                                                system,
                                                                path,
                                                                request.GET.get('length')))
            response = tapis_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())

            operation in NOTIFY_ACTIONS and \
                notify(request.user.username, operation, 'success', {'response': response})
        except (InternalServerError, UnauthorizedError) as e:
            error_status = e.response.status_code
            error_json = e.response.json()
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            if error_status == 500 or error_status == 401:
                logger.info(e)
                # In case of 500 determine cause
                system = client.systems.getSystem(systemId=system)
                allocations = get_allocations(request.user.username)

                # If user is missing a non-corral allocation mangle error to a 403
                if not any(system.host.endswith(ele) for ele in
                           list(allocations['hosts'].keys()) + ['corral.tacc.utexas.edu', 'data.tacc.utexas.edu']):
                    raise PermissionDenied

                # If a user needs to push keys, return a response specifying the system
                error_json['system'] = system
                return JsonResponse(error_json, status=error_status, encoder=BaseTapisResultSerializer)
            raise e

        return JsonResponse({'data': response})

    def put(self, request, operation=None, scheme=None,
            handler=None, system=None, path='/'):
        body = json.loads(request.body)
        try:
            client = request.user.tapis_oauth.client
        except AttributeError:
            return HttpResponseForbidden("This data requires authentication to view.")

        try:
            METRICS.info("user:{} op:{} api:tapis scheme:{} "
                         "system:{} path:{} body:{}".format(request.user.username,
                                                            operation,
                                                            scheme,
                                                            system,
                                                            path,
                                                            body))
            response = tapis_put_handler(client, scheme, system, path, operation, body=body)
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})

    def post(self, request, operation=None, scheme=None,
             handler=None, system=None, path='/'):
        body = request.FILES.dict()
        try:
            client = request.user.tapis_oauth.client
        except AttributeError:
            return HttpResponseForbidden("This data requires authentication to upload.")

        try:
            METRICS.info("user:{} op:{} api:tapis scheme:{} "
                         "system:{} path:{} filename:{}".format(request.user.username,
                                                                operation,
                                                                scheme,
                                                                system,
                                                                path,
                                                                body['uploaded_file'].name))

            response = tapis_post_handler(client, scheme, system, path, operation, body=body)
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})


class GoogleDriveFilesView(BaseApiView):
    def get(self, request, operation=None, scheme=None, system=None,
            path='root'):
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            raise ApiException("Login Required", status=400)
        try:
            response = googledrive_get_handler(
                client, scheme, system, path, operation, **request.GET.dict())
        except HTTPError as e:
            raise e

        return JsonResponse({'data': response})

    def put(self, request, operation=None, scheme=None,
            handler=None, system=None, path='root'):

        body = json.loads(request.body)
        try:
            client = request.user.googledrive_user_token.client
        except AttributeError:
            return HttpResponseForbidden

        try:
            response = googledrive_put_handler(client, scheme, system, path,
                                               operation, body=body)
        except Exception as exc:
            operation in NOTIFY_ACTIONS and notify(request.user.username, operation, 'error', {})
            raise exc

        return JsonResponse({"data": response})


def get_client(user, api):
    client_mappings = {
        'tapis': 'tapis_oauth',
        'shared': 'tapis_oauth',
        'googledrive': 'googledrive_user_token',
        'box': 'box_user_token',
        'dropbox': 'dropbox_user_token'
    }
    return getattr(user, client_mappings[api]).client


class TransferFilesView(BaseApiView):
    def put(self, request, filetype):
        body = json.loads(request.body)

        src_client = get_client(request.user, body['src_api'])
        dest_client = get_client(request.user, body['dest_api'])

        try:
            if filetype == 'dir':
                transfer_folder(src_client, dest_client, **body)
            else:
                transfer(src_client, dest_client, **body)

            return JsonResponse({'success': True})
        except Exception as exc:
            logger.info(exc)
            notify(request.user.username, 'copy', 'error', {})
            raise exc


@method_decorator(login_required, name='dispatch')
class LinkView(BaseApiView):
    def create_postit(self, request, scheme, system, path):

        client = request.user.tapis_oauth.client

        # Create postit for unlimited use with a valid period of 1 year
        postit = client.files.createPostIt(systemId=system, path=path, allowedUses=-1, validSeconds=31536000)

        postit_redeem_url = postit.redeemUrl
        Link.objects.create(
            tapis_uri=f"{system}/{path}",
            postit_url=postit_redeem_url,
            expiration=dateutil.parser.parse(postit.expiration) if postit.expiration else None
        )
        return {"data": postit_redeem_url, "expiration": postit.expiration}

    def delete_link(self, request, link):
        client = request.user.tapis_oauth.client

        postitId = link.get_uuid()

        client.files.deletePostIt(postitId=postitId)
        link.delete()

        return "OK"

    def get(self, request, scheme, system, path):
        """Given a file, returns a link for a file
        """
        try:
            link = Link.objects.get(tapis_uri=f"{system}/{path}")
        except Link.DoesNotExist:
            return JsonResponse({"data": None, "expiration": None})

        return JsonResponse({"data": link.postit_url, "expiration": link.expiration})

    def delete(self, request, scheme, system, path):
        """Delete an existing link for a file
        """
        try:
            link = Link.objects.get(tapis_uri=f"{system}/{path}")
        except Link.DoesNotExist:
            raise ApiException("Post-it does not exist")
        response = self.delete_link(request, link)
        return JsonResponse({"data": response})

    def post(self, request, scheme, system, path):
        """Generates a new link for a file
        """
        try:
            Link.objects.get(tapis_uri=f"{system}/{path}")
        except Link.DoesNotExist:
            # Link doesn't exist - proceed with creating one
            postit = self.create_postit(request, scheme, system, path)
            return JsonResponse({"data": postit['data'], "expiration": postit['expiration']})
        # Link for this file already exists, raise an exception
        raise ApiException("Link for this file already exists")

    def put(self, request, scheme, system, path):
        """Replace an existing link for a file
        """
        try:
            link = Link.objects.get(tapis_uri=f"{system}/{path}")
            self.delete_link(request, link)
        except Link.DoesNotExist:
            raise ApiException("Could not find pre-existing link")
        postit = self.create_postit(request, scheme, system, path)
        return JsonResponse({"data": postit['data'], "expiration": postit['expiration']})
