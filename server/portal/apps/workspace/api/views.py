"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
import logging
import json
from urllib.parse import urlparse
from datetime import timedelta
from django.utils import timezone
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
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.workspace.managers.user_applications import UserApplicationsManager
from portal.utils.translations import url_parse_inputs
from portal.apps.workspace.models import JobSubmission
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.apps.workspace.models import AppTrayCategory, AppTrayEntry

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


def _get_app(app_id, user):
    agave = user.agave_oauth.client
    data = {'definition': agave.apps.get(appId=app_id)}

    # GET EXECUTION SYSTEM INFO FOR USER APPS
    exec_sys = ExecutionSystem(agave, data['definition']['executionSystem'])
    data['exec_sys'] = exec_sys.to_dict()

    # set maxNodes from system queue for app
    if (data['definition']['parallelism'] == 'PARALLEL') and ('defaultQueue' in data['definition']):
        for queue in exec_sys.queues.all():
            if queue.name == data['definition']['defaultQueue']:
                data['definition']['maxNodes'] = queue.maxNodes
                break

    lic_type = _app_license_type(app_id)
    data['license'] = {
        'type': lic_type
    }
    if lic_type is not None:
        _, license_models = get_license_info()
        license_model = list(filter(lambda x: x.license_type == lic_type, license_models))[0]
        lic = license_model.objects.filter(user=user).first()
        data['license']['enabled'] = lic is not None

    # Update any App Tray entries upon app retrieval, if their revision numbers have changed
    matching = AppTrayEntry.objects.all().filter(name=data['definition']['name'])
    if len(matching) > 0:
        first_match = matching[0]
        if first_match.lastRetrieved and first_match.lastRetrieved != data['definition']['id']:
            data['lastRetrieved'] = first_match.lastRetrieved

    return data


@method_decorator(login_required, name='dispatch')
class AppsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        app_id = request.GET.get('app_id')
        if app_id:
            METRICS.debug("user:{} is requesting app id:{}".format(request.user.username, app_id))
            data = _get_app(app_id, request.user)

            if settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS:
                # check if default system needs keys pushed
                default_sys = UserSystemsManager(
                    request.user,
                    settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
                )
                storage_sys = StorageSystem(agave, default_sys.get_system_id())
                success, result = storage_sys.test()
                data['systemHasKeys'] = success
                data['pushKeysSystem'] = storage_sys.to_dict()
        else:
            METRICS.debug("user:{} is requesting all public apps".format(request.user.username))
            public_only = request.GET.get('publicOnly')
            name = request.GET.get('name', None)
            list_kwargs = {}
            if public_only == 'true':
                list_kwargs['publicOnly'] = 'true'
            else:
                list_kwargs['privateOnly'] = True
            if name:
                list_kwargs['query'] = {
                    "name": name
                }
            data = {'appListing': agave.apps.list(**list_kwargs)}

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

            assert len(data) == 1, "Expected single app response, got {}.".format(len(data))
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
        return JsonResponse({'response': {'listing': data, 'default_tab': settings.PORTAL_APPS_DEFAULT_TAB}})

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

            # TODO: Decouple this from front end somehow
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
            limit = int(request.GET.get('limit', 10))
            offset = int(request.GET.get('offset', 0))
            period = request.GET.get('period', 'all')

            jobs = JobSubmission.objects.all().filter(user=request.user).order_by('-time')

            if period != "all":
                enddate = timezone.now()
                if period == "day":
                    days = 1
                elif period == "week":
                    days = 7
                elif period == "month":
                    days = 30
                startdate = enddate - timedelta(days=days)
                jobs = jobs.filter(time__range=[startdate, enddate])

            all_user_job_ids = [job.jobId for job in jobs]
            user_job_ids = all_user_job_ids[offset:offset + limit]
            if user_job_ids:
                data = agave.jobs.list(query={'id.in': ','.join(user_job_ids)})
                # re-order agave job info to match our time-ordered jobs
                # while also taking care that tapis in rare cases might no longer
                # have that job (see https://jira.tacc.utexas.edu/browse/FP-975)
                data = list(filter(None, [next((job for job in data if job["id"] == id), None) for id in user_job_ids]))
            else:
                data = []

        return JsonResponse({"response": data})

    def delete(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        job_id = request.GET.get('job_id')
        METRICS.info("user:{} is deleting job id:{}".format(request.user.username, job_id))
        data = agave.jobs.delete(jobId=job_id)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        agave = request.user.agave_oauth.client
        job_post = json.loads(request.body)
        job_id = job_post.get('job_id')
        job_action = job_post.get('action')

        # cancel job / stop job
        if job_id and job_action:
            METRICS.info("user:{} is canceling/stopping job id:{}".format(request.user.username, job_id))
            data = agave.jobs.manage(jobId=job_id, body={"action": job_action})
            return JsonResponse({"response": data})
        # submit job
        elif job_post:
            METRICS.info("user:{} is submitting job:{}".format(request.user.username, job_post))
            default_sys = UserSystemsManager(
                request.user,
                settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
            )

            # cleaning archive path value
            if job_post.get('archivePath'):
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
                    job_post['archiveSystem'] = default_sys.get_system_id()
            else:
                job_post['archivePath'] = \
                    'archive/jobs/{}/${{JOB_NAME}}-${{JOB_ID}}'.format(
                        timezone.now().strftime('%Y-%m-%d'))
                job_post['archiveSystem'] = default_sys.get_system_id()

            # check for running licensed apps
            lic_type = _app_license_type(job_post['appId'])
            if lic_type is not None:
                _, license_models = get_license_info()
                license_model = [x for x in license_models if x.license_type == lic_type][0]
                lic = license_model.objects.filter(user=request.user).first()
                if not lic:
                    raise ApiException("You are missing the required license for this application.")
                job_post['parameters']['_license'] = lic.license_as_str()

            # url encode inputs
            if job_post['inputs']:
                job_post = url_parse_inputs(job_post)

            # Get or create application based on allocation and execution system
            apps_mgr = UserApplicationsManager(request.user)
            app = apps_mgr.get_or_create_app(job_post['appId'], job_post['allocation'])

            if app.exec_sys:
                return JsonResponse({"response": {"execSys": app.exec_sys.to_dict()}})

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
            METRICS.info("user:{} agave.systems.listRoles system_id:{}".format(request.user.username, system_id))
            agc = service_account()
            data = agc.systems.listRoles(systemId=system_id)
        elif user_role:
            METRICS.info("user:{} agave.systems.getRoleForUser system_id:{}".format(request.user.username, system_id))
            agc = service_account()
            data = agc.systems.getRoleForUser(systemId=system_id, username=request.user.username)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        body = json.loads(request.body)
        role = body['role']
        system_id = body['system_id']
        METRICS.info("user:{} agave.systems.updateRole system_id:{}".format(request.user.username, system_id))
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


@method_decorator(login_required, name='dispatch')
class AppsTrayView(BaseApiView):
    def getAppIdBySpec(self, app, user):
        # Retrieve the app specified in the portal
        # Any fields that are left blank assume that we
        # are retrieving the "latest" version
        agave = user.agave_oauth.client
        query = {
            "name": app.name,
            "isPublic": True
        }
        if app.version and len(app.version):
            query['version'] = app.version
        if app.revision and len(app.revision):
            query['revision'] = app.revision
        appList = agave.apps.list(query=query)
        appList.sort(
            key=lambda appDef: [int(u) for u in appDef['version'].split('.')] + [int(appDef['revision'])]
        )
        return appList[-1]['id']

    def getApp(self, app, user):
        return _get_app(self.getAppId(app, user), user)

    def getAppId(self, app, user):
        if app.appId and len(app.appId) > 0:
            appId = app.appId
        else:
            appId = self.getAppIdBySpec(app, user)
        if appId != app.lastRetrieved:
            app.lastRetrieved = appId
            app.save()
        return appId

    def getPrivateApps(self, user):
        agave = user.agave_oauth.client
        apps_listing = agave.apps.list(privateOnly=True)
        my_apps = []
        # Get private apps that are not prtl.clone
        for app in filter(lambda app: not app['id'].startswith("prtl.clone"), apps_listing):
            # Create an app "metadata" record
            try:
                my_apps.append(
                    {
                        "label": app['label'] or app['id'],
                        "version": app['version'],
                        "revision": app['revision'],
                        "shortDescription": app['shortDescription'],
                        "type": "agave",
                        "appId": app['id'],
                    }
                )
            except Exception as e:
                logger.error(
                    "User {} was unable to retrieve their private app {}".format(
                        user.username, app['id']
                    )
                )
                logger.exception(e)
        return my_apps

    def getPublicApps(self, user):
        categories = []
        definitions = {}
        # Traverse category records in descending priority
        for category in AppTrayCategory.objects.all().order_by('-priority'):
            categoryResult = {
                "title": category.category,
                "apps": []
            }

            # Retrieve all apps known to the portal in that directory
            apps = AppTrayEntry.objects.all().filter(available=True, category=category)
            for app in apps:
                # Create something similar to the old metadata record
                appRecord = {
                    "label": app.label or app.name,
                    "icon": app.icon,
                    "version": app.version,
                    "revision": app.revision,
                    "type": app.appType
                }

                try:
                    if str(app.appType).lower() == 'html':
                        # If this is an HTML app, create a definition for it
                        # that has the 'html' field
                        appRecord["appId"] = app.htmlId
                        definitions[app.htmlId] = {
                            "html": app.html,
                            "id": app.htmlId,
                            "label": app.label,
                            "shortDescription": app.shortDescription,
                            "appType": "html"
                        }
                    elif str(app.appType).lower() == 'agave':
                        # If this is an agave app, retrieve the definition
                        # from the tenant, with any license or queue
                        # post processing
                        appId = self.getAppId(app, user)
                        appRecord["appId"] = appId

                    categoryResult["apps"].append(appRecord)
                except Exception:
                    logger.info("Could not retrieve app {}".format(app))

            categoryResult["apps"].sort(key=lambda app: app['label'])
            categories.append(categoryResult)

        return categories, definitions, ApiException("made up error", status=500)

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
        tabs, definitions = self.getPublicApps(request.user)
        my_apps = self.getPrivateApps(request.user)
        tabs.insert(
            0,
            {
                "title": "My Apps",
                "apps": my_apps
            }
        )
        # Only return tabs that are non-empty
        tabs = list(
            filter(
                lambda tab: len(tab["apps"]) > 0,
                tabs
            )
        )

        return JsonResponse({"tabs": tabs, "definitions": definitions})
