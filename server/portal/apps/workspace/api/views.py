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
from django.db.models.functions import Coalesce
from django.core.serializers import serialize
from portal.utils.translations import get_jupyter_url
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info
from portal.libs.agave.utils import service_account
from portal.libs.agave.serializers import BaseTapisResultSerializer
from portal.apps.workspace.managers.user_applications import UserApplicationsManager
from portal.utils.translations import url_parse_inputs
from portal.apps.workspace.models import JobSubmission
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.apps.workspace.models import AppTrayCategory, AppTrayEntry
from .handlers.tapis_handlers import tapis_get_handler

logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


def _app_license_type(app_def):
    app_lic_type = getattr(app_def.notes, 'licenseType', None)
    lic_type = app_lic_type if app_lic_type in LICENSE_TYPES else None
    return lic_type


def _app_license_type_TODO_REFACTOR(app_id):
    # job submission wants to do a check from app (using app_id) if user needs license before submitting job.
    return None


def _get_app(app_id, app_version, user):
    tapis = user.tapis_oauth.client
    if app_version:
        app_def = tapis.apps.getApp(appId=app_id, appVersion=app_version)
    else:
        app_def = tapis.apps.getAppLatestVersion(appId=app_id)
    data = {'definition': app_def}

    # GET EXECUTION SYSTEM INFO TO PROCESS SPECIFIC SYSTEM DATA E.G. QUEUE INFORMATION
    data['exec_sys'] = tapis.systems.getSystem(systemId=app_def.jobAttributes.execSystemId)

    lic_type = _app_license_type(app_def)
    data['license'] = {
        'type': lic_type
    }
    if lic_type is not None:
        _, license_models = get_license_info()
        license_model = list(filter(lambda x: x.license_type == lic_type, license_models))[0]
        lic = license_model.objects.filter(user=user).first()
        data['license']['enabled'] = lic is not None

    return data


@method_decorator(login_required, name='dispatch')
class AppsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        tapis = request.user.tapis_oauth.client
        app_id = request.GET.get('appId')
        app_version = request.GET.get('appVersion')
        if app_id:
            METRICS.debug("user:{} is requesting app id:{} version:{}".format(request.user.username, app_id, app_version))
            data = _get_app(app_id, app_version, request.user)

            # TODO: Test user default storage system (for archiving)
            # if settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS:
            #     # check if default system needs keys pushed
            #     default_sys = UserSystemsManager(
            #         request.user,
            #         settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
            #     )
            #     storage_sys = StorageSystem(tapis, default_sys.get_system_id())
            #     success, _ = storage_sys.test()
            #     data['systemHasKeys'] = success
            #     data['pushKeysSystem'] = storage_sys.to_dict()
        else:
            METRICS.debug("user:{} is requesting all apps".format(request.user.username))
            data = {'appListing': tapis.apps.getApps()}

        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )


@method_decorator(login_required, name='dispatch')
class JobsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        agave = request.user.tapis_oauth.client
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
        agave = request.user.tapis_oauth.client
        job_id = request.GET.get('job_id')
        METRICS.info("user:{} is deleting job id:{}".format(request.user.username, job_id))
        data = agave.jobs.delete(jobId=job_id)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        agave = request.user.tapis_oauth.client
        job_post = json.loads(request.body)
        job_id = job_post.get('job_id')
        job_action = job_post.get('action')

        if job_id and job_action:
            # resubmit job
            if job_action == 'resubmit':
                METRICS.info("user:{} is resubmitting job id:{}".format(request.user.username, job_id))
            # cancel job / stop job
            else:
                METRICS.info("user:{} is canceling/stopping job id:{}".format(request.user.username, job_id))

            data = agave.jobs.manage(jobId=job_id, body={"action": job_action})

            if job_action == 'resubmit':
                if "id" in data:
                    job = JobSubmission.objects.create(
                        user=request.user,
                        jobId=data["id"]
                    )
                    job.save()

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
            lic_type = _app_license_type_TODO_REFACTOR(job_post['appId'])
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
        agave = request.user.tapis_oauth.client
        data = agave.jobs.getHistory(jobId=job_uuid)
        return JsonResponse({"response": data})


@method_decorator(login_required, name='dispatch')
class AppsTrayView(BaseApiView):
    def getPrivateApps(self, user):
        tapis = user.tapis_oauth.client
        # TODO: make sure to exclude public apps
        # TODO: update label if label is ever added to tapis apps spec
        apps_listing = tapis.apps.getApps(select="version,id", search=f"(owner.eq.{user.username})~(enabled.eq.true)")
        my_apps = list(map(lambda app: {
            "label": app.id,
            "version": app.version,
            "type": "tapis",
            "appId": app.id,
        }, apps_listing))

        return my_apps

    def getPublicApps(self, user):
        # TODO: make tapipy request for public apps to compare against apps in AppTrayEntry
        categories = []
        html_definitions = {}
        # Traverse category records in descending priority
        for category in AppTrayCategory.objects.all().order_by('-priority'):

            # Retrieve all apps known to the portal in that directory
            tapis_apps = list(AppTrayEntry.objects.all().filter(available=True, category=category, appType='tapis')
                              .order_by(Coalesce('label', 'appId')).values('appId', 'appType', 'html', 'icon', 'label', 'version'))
            html_apps = list(AppTrayEntry.objects.all().filter(available=True, category=category, appType='html')
                             .order_by(Coalesce('label', 'appId')).values('appId', 'appType', 'html', 'icon', 'label', 'version'))

            categoryResult = {
                "title": category.category,
                "apps": tapis_apps
            }

            # Add html apps to html_definitions
            for app in html_apps:
                html_definitions[app['appId']] = app

                categoryResult["apps"].append(app)

            categories.append(categoryResult)

        return categories, html_definitions

    def get(self, request):
        """
        Returns a structure containing app tray categories with metadata, and html definitions

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
            "html_definitions": {
                "jupyterhub": { ... }
            }
        }
        """
        tabs, html_definitions = self.getPublicApps(request.user)
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

        return JsonResponse(
            {
                "tabs": tabs,
                "definitions": html_definitions
            },
            encoder=BaseTapisResultSerializer
        )


@method_decorator(login_required, name='dispatch')
class TapisAppsView(BaseApiView):
    def get(self, request, operation=None):
        try:
            client = request.user.tapis_oauth.client
        except AttributeError:
            return JsonResponse(
                {'message': 'This view requires authentication.'},
                status=403)

        get_params = request.GET.dict()
        METRICS.info('user:%s op:%s query_params:%s' % (request.user.username, operation, get_params))
        response = tapis_get_handler(client, operation, **get_params)

        return JsonResponse({'data': response})
