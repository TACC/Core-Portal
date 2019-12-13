"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
import logging
import json
from urllib.parse import urlparse
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.urls import reverse
from portal.utils.translations import get_jupyter_url
from portal.apps.workspace.api import lookups as LookupManager
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info
from portal.libs.agave.utils import service_account
from agavepy.agave import Agave
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.apps.workspace.managers.user_applications import UserApplicationsManager
from portal.utils.translations import url_parse_inputs
from portal.apps.workspace.models import JobSubmission


logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


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

            # GET EXECUTION SYSTEM INFO FOR USER APPS
            exec_sys = ExecutionSystem(agave, data['executionSystem'])
            data['resource'] = exec_sys.login.host
            data['scheduler'] = exec_sys.scheduler
            data['exec_sys'] = exec_sys.to_dict()

            # set maxNodes from system queue for app
            if (data['parallelism'] == 'PARALLEL') and ('defaultQueue' in data):
                for queue in exec_sys.queues.all():
                    if queue.name == data['defaultQueue']:
                        data['maxNodes'] = queue.maxNodes
                        break

            lic_type = _app_license_type(app_id)
            data['license'] = {
                'type': lic_type
            }
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = [x for x in license_models if x.license_type == lic_type][0]
                lic = license_model.objects.filter(user=request.user).first()
                data['license']['enabled'] = lic is not None
        else:
            METRICS.debug("User " + request.user.username + " is requesting all public apps")
            public_only = request.GET.get('publicOnly')
            if public_only == 'true':
                data = agave.apps.list(publicOnly='true')
            else:
                data = agave.apps.list(privateOnly=True)
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
                license_model = [x for x in license_models if x.license_type == lic_type][0]
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

        if meta_uuid:
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

            # TODO: Decouple this from front end somehow!
            archiveSystem = data.get('archiveSystem', None)
            if archiveSystem:
                archive_system_path = '{}/{}'.format(archiveSystem, data['archivePath'])
                data['archiveUrl'] = '/workbench/data-depot/'
                data['archiveUrl'] += 'agave/{}/'.format(archive_system_path.strip('/'))

                jupyter_url = get_jupyter_url(
                    archiveSystem,
                    "/" + data['archivePath'],
                    request.user.username,
                    is_dir=True
                )
                if jupyter_url:
                    data['jupyterUrl'] = jupyter_url

        # list jobs
        else:
            limit = request.GET.get('limit', 10)
            offset = request.GET.get('offset', 0)
            period = request.GET.get('period', 'all')

            data = agave.jobs.list(limit=limit, offset=offset)
            jobs = JobSubmission.objects.all().filter(user=request.user)

            if period != "all":
                enddate = datetime.now()
                if period == "day":
                    days = 1
                elif period == "week":
                    days = 7
                elif period == "month":
                    days = 30
                startdate = enddate - timedelta(days=days)
                jobs = jobs.filter(time__range=[startdate, enddate])

            user_job_ids = [
                job.jobId for job in jobs
            ]
            data = list(
                filter(
                    lambda job: job["id"] in user_job_ids,
                    data
                )
            )

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
        job_action = job_post.get('action')

        # cancel job / stop job
        if job_id and job_action:
            data = agave.jobs.manage(jobId=job_id, body={"action": job_action})
            return JsonResponse({"response": data})
        # submit job
        elif job_post:

            # cleaning archive path value
            if 'archivePath' in job_post:
                parsed = urlparse(job_post['archivePath'])
                if parsed.path.startswith('/') and len(parsed.path) > 1:
                    # strip leading '/'
                    archive_path = parsed.path[1:]
                elif parsed.path == '':
                    # if path is blank, set to root of system
                    archive_path = '/'
                else:
                    archive_path = parsed.path

                job_post['archivePath'] = archive_path

                if parsed.netloc:
                    job_post['archiveSystem'] = parsed.netloc
                else:
                    job_post['archiveSystem'] = \
                        settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(
                            request.user.username)
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
                license_model = [x for x in license_models if x.license_type == lic_type][0]
                lic = license_model.objects.filter(user=request.user).first()
                job_post['parameters']['_license'] = lic.license_as_str()

            # url encode inputs
            # TODO: PUll this out of here and make it a utility
            if job_post['inputs']:
                job_post = url_parse_inputs(job_post)

            # Get or create application based on allocation and execution system
            apps_mgr = UserApplicationsManager(request.user)
            app = apps_mgr.get_or_create_app(job_post['appId'], job_post['allocation'])

            if app._new_exec_sys:
                return JsonResponse({"response": {"execSys": app._new_exec_sys.to_dict()}})

            job_post['appId'] = app.id
            del job_post['allocation']

            if settings.DEBUG:
                wh_base_url = settings.WH_BASE_URL + '/webhooks/'
                jobs_wh_url = settings.WH_BASE_URL + reverse('webhooks:jobs_wh_handler')
            else:
                wh_base_url = request.build_absolute_uri('/webhooks/')
                jobs_wh_url = request.build_absolute_uri(reverse('webhooks:jobs_wh_handler'))

            job_post['parameters']['_webhook_base_url'] = wh_base_url
            job_post['notifications'] = [
                {'url': jobs_wh_url,
                 'event': e}
                for e in settings.PORTAL_JOB_NOTIFICATION_STATES]

            # Remove any params from job_post that are not in appDef
            job_post['parameters'] = {param: job_post['parameters'][param]
                                      for param in job_post['parameters']
                                      if param in [p['id'] for p in app.parameters]}

            response = agave.jobs.submit(body=job_post)
            if "id" in response:
                job = JobSubmission.objects.create(
                    user=request.user,
                    jobId=response["id"]
                )
                job.save()

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


@method_decorator(login_required, name='dispatch')
class JobHistoryView(BaseApiView):
    def get(self, request, job_uuid):
        agave = request.user.agave_oauth.client
        data = agave.jobs.getHistory(jobId=job_uuid)
        return JsonResponse({"response": data})
