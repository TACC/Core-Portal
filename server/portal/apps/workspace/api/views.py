"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
from __future__ import unicode_literals, absolute_import
import logging
import json
import urllib
import six
from urlparse import urlparse
from datetime import datetime
from django.http import JsonResponse, HttpResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.core.urlresolvers import reverse
from portal.apps.workspace.api import lookups as LookupManager
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info
from portal.libs.agave.utils import service_account
from agavepy.agave import Agave



#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))
#pylint: enable=invalid-name

def get_manager(request, file_mgr_name):
    """Lookup Manager to handle call"""
    fmgr_cls = LookupManager.lookup_manager(file_mgr_name)
    fmgr = fmgr_cls(request)
    if fmgr.requires_auth and not request.user.is_authenticated:
        raise ApiException("Login Required", status=403)
    return fmgr


def _app_license_type(app_id):
    app_lic_type = app_id.replace('-{}'.format(app_id.split('-')[-1]), '').upper()
    lic_type = next((t for t in LICENSE_TYPES if t in app_lic_type), None)
    return lic_type

@method_decorator(login_required, name='dispatch')
class AppsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        app_id = request.GET.get('app_id')
        if app_id:
            METRICS.debug("User " + request.user.username + " is requesting app id " + app_id)
            data = agave.apps.get(appId=app_id)
            lic_type = _app_license_type(app_id)
            data['license'] = {
                'type': lic_type
            }
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                lic = license_model.objects.filter(user=request.user).first()
                data['license']['enabled'] = lic is not None
        else:
            METRICS.debug("User " + request.user.username + " is requesting all public apps")
            public_only = request.GET.get('publicOnly')
            if public_only == 'true':
                data = agave.apps.list(publicOnly='true')
            else:
                data = agave.apps.list()
        return JsonResponse({"response": data})

@method_decorator(login_required, name='dispatch')
class MonitorsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        target = request.GET.get('target')
        logger.info(request.GET)
        admin_client = Agave(api_server=getattr(settings, 'AGAVE_TENANT_BASEURL'),
                token=getattr(settings, 'AGAVE_SUPER_TOKEN'))
        data = admin_client.monitors.list(target=target)
        return JsonResponse({"response": data})


@method_decorator(login_required, name='dispatch')
class MetadataView(BaseApiView):
    def get(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        app_id = request.GET.get('app_id')
        if app_id:
            query = json.dumps({
                '$and': [
                    {'name': {'$in': settings.PORTAL_APPS_METADATA_NAMES}},
                    {'value.definition.available': True},
                    {'value.definition.id': app_id}
                ]
            })

            data = agave.meta.listMetadata(q=query)

            assert len(data) == 1, "Expected single app response, got {}!".format(len(data))
            data = data[0]

            lic_type = _app_license_type(app_id)
            data['license'] = {
                'type': lic_type
            }
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                lic = license_model.objects.filter(user=request.user).first()
                data['license']['enabled'] = lic is not None
        else:
            query = request.GET.get('q')
            if not query:
                query = json.dumps({
                    '$and': [
                        {'name': {'$in': settings.PORTAL_APPS_METADATA_NAMES}},
                        {'value.definition.available': True}
                    ]
                })
            data = agave.meta.listMetadata(q=query)
        return JsonResponse({'response': data})

    def post(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        meta_post = json.loads(request.body)
        meta_uuid = meta_post.get('uuid')

        # NOTE: Only needed for tacc.prod tenant
        share_all = request.GET.get('share_all')
        if share_all and settings.AGAVE_TENANT_BASEURL=='https://api.tacc.utexas.edu':
            agc = service_account()
            username = request.user.username
            if username == settings.PORTAL_ADMIN_USERNAME:
                return HttpResponse('User is admin', status=200)
            query = request.GET.get('q')
            if not query:
                query = json.dumps({
                    '$and': [
                        {'name': {'$in': settings.PORTAL_APPS_METADATA_NAMES}},
                        {'value.definition.available': True}
                    ]
                })
            meta_post['username'] = username
            apps = agc.meta.listMetadata(q=query)
            for app_meta in apps:
                data = agc.meta.updateMetadataPermissionsForUser(body=meta_post, uuid=app_meta.uuid, username=username)
                if app_meta.value['type'] == 'agave':
                    data = agc.apps.updateApplicationPermissions(body={'username': username, 'permission': 'READ_EXECUTE'}, appId=app_meta.value['definition']['id'])
        elif meta_uuid:
            del meta_post['uuid']
            data = agave.meta.updateMetadata(uuid=meta_uuid, body=meta_post)
        else:
            data = agave.meta.addMetadata(body=meta_post)
        return JsonResponse({'response': data})

    def delete(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        meta_uuid = request.GET.get('uuid')
        if meta_uuid:
            data = agave.meta.deleteMetadata(uuid=meta_uuid)
            return JsonResponse({'response': data})


@method_decorator(login_required, name='dispatch')
class JobsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        job_id = request.GET.get('job_id')

        # get specific job info
        if job_id:
            data = agave.jobs.get(jobId=job_id)
            q = {"associationIds": job_id}
            job_meta = agave.meta.listMetadata(q=json.dumps(q))
            data['_embedded'] = {"metadata": job_meta}

            #TODO: Decouple this from front end somehow!
            archive_system_path = '{}/{}'.format(data['archiveSystem'], data['archivePath'])
            data['archiveUrl'] = '/workbench/data-depot/'
            data['archiveUrl'] += 'agave/{}/'.format(archive_system_path)

        # list jobs
        else:
            limit = request.GET.get('limit', 10)
            offset = request.GET.get('offset', 0)
            data = agave.jobs.list(limit=limit, offset=offset)

        return JsonResponse({"response": data})

    def delete(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        job_id = request.GET.get('job_id')
        # METRICS.debug("User " + request.user.username + " is deleting job id " + job_id)
        data = agave.jobs.delete(jobId=job_id)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        job_post = json.loads(request.body)
        job_id = job_post.get('job_id')

        # cancel job / stop job
        if job_id:
            data = agave.jobs.manage(jobId=job_id, body='{"action":"stop"}')
            return JsonResponse({"response": data})
        # submit job
        elif job_post:

            # cleaning archive path value
            if 'archivePath' in job_post:
                parsed = urlparse(job_post['archivePath'])
                if parsed.path.startswith('/') and len(parsed.path) > 1:
                    # strip leading '/'
                    archive_path = parsed.path[1:]
                else:
                    archive_path = parsed.path

                job_post['archivePath'] = archive_path

                if parsed.netloc:
                    job_post['archiveSystem'] = parsed.netloc
            else:
                job_post['archivePath'] = \
                    'archive/jobs/{}/${{JOB_NAME}}-${{JOB_ID}}'.format(
                        datetime.now().strftime('%Y-%m-%d'))
                job_post['archiveSystem'] = \
                    settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(request.user.username)

            # check for running licensed apps
            lic_type = _app_license_type(job_post['appId'])
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = filter(lambda x: x.license_type == lic_type, license_models)[0]
                lic = license_model.objects.filter(user=request.user).first()
                job_post['parameters']['_license'] = lic.license_as_str()

            # url encode inputs
            if job_post['inputs']:
                for key, value in six.iteritems(job_post['inputs']):
                    parsed = urlparse(value)
                    if parsed.scheme:
                        job_post['inputs'][key] = '{}://{}{}'.format(
                            parsed.scheme, parsed.netloc, urllib.quote(parsed.path))
                    else:
                        job_post['inputs'][key] = urllib.quote(parsed.path)

            response = agave.jobs.submit(body=job_post)
            return JsonResponse({"response": response})


@method_decorator(login_required, name='dispatch')
class SystemsView(BaseApiView):

    def get(self, request, *args, **kwargs):

        roles = request.GET.get('roles')
        user_role = request.GET.get('user_role')
        system_id = request.GET.get('system_id')
        if roles:
            METRICS.info('agave.systems.listRoles', extra={
                'operation': 'agave.systems.listRoles',
                'user': request.user.username,
                'info': {
                    'system_id': system_id
                }
            })
            agc = service_account()
            data = agc.systems.listRoles(systemId=system_id)
        elif user_role:
            METRICS.info('agave.systems.getRoleForUser', extra={
                'operation': 'agave.systems.getRoleForUser',
                'user': request.user.username,
                'info': {
                    'system_id': system_id
                }
            })
            agc = service_account()
            data = agc.systems.getRoleForUser(systemId=system_id, username=request.user.username)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        body = json.loads(request.body)
        role = body['role']
        system_id = body['system_id']
        METRICS.info('agave.systems.updateRole', extra={
            'operation': 'agave.systems.updateRole',
            'user': request.user.username,
            'info': {
                'system_id': system_id
            }
        })
        role_body = {
            'username': request.user.username,
            'role': role
        }
        agc = service_account()
        data = agc.systems.updateRole(systemId=system_id, body=role_body)
        return JsonResponse({"response": data})
