"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
import logging
import json
from urllib.parse import urlparse
from django.utils import timezone
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.urls import reverse
from django.db.models.functions import Coalesce
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


def _get_user_app_license(license_type, user):
    _, license_models = get_license_info()
    license_model = [x for x in license_models if x.license_type == license_type]
    if not license_model:
        return None
    lic = license_model.objects.filter(user=user).first()
    return lic


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
        lic = _get_user_app_license(lic_type, user)
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

            # TODOv3: Test user default storage system (for archiving)
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
        tapis = request.user.tapis_oauth.client
        job_uuid = request.GET.get('job_uuid')

        # get specific job info
        if job_uuid:
            data = tapis.jobs.getJob(jobUuid=job_uuid)

        # list jobs
        else:
            limit = int(request.GET.get('limit', 10))
            offset = int(request.GET.get('offset', 0))
            # TODOv3: Query portal
            # portal_name = settings.PORTAL_NAMESPACE

            data = tapis.jobs.getJobSearchList(
                limit=limit,
                startAfter=offset,
                orderBy='lastUpdated(desc),name(asc)'
                # _tapis_query_parameters={'tags.contains': portal_name}
            )

        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )

    def delete(self, request, *args, **kwargs):
        tapis = request.user.tapis_oauth.client
        job_uuid = request.GET.get('job_uuid')
        METRICS.info("user:{} is deleting job uuid:{}".format(request.user.username, job_uuid))
        data = tapis.jobs.hideJob(jobUuid=job_uuid)
        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )

    def post(self, request, *args, **kwargs):
        tapis = request.user.tapis_oauth.client
        job_post = json.loads(request.body)
        job_uuid = job_post.get('job_uuid')
        job_action = job_post.get('action')

        if job_uuid and job_action:
            if job_action == 'resubmit':
                METRICS.info("user:{} is resubmitting job uuid:{}".format(request.user.username, job_uuid))
                data = tapis.jobs.resubmitJob(jobUuid=job_uuid)

                job = JobSubmission.objects.create(
                    user=request.user,
                    jobId=data["uuid"]
                )
                job.save()
            elif job_action == 'cancel':
                METRICS.info("user:{} is canceling/stopping job uuid:{}".format(request.user.username, job_uuid))
                data = tapis.jobs.cancelJob(jobUuid=job_uuid)
            else:
                raise ApiException("user:{} is trying to run an unsupported job action: {} for job uuid: {}".format(
                    request.user.username,
                    job_action,
                    job_uuid
                ), status=400)

            return JsonResponse(
                {
                    'status': 200,
                    'response': data,
                },
                encoder=BaseTapisResultSerializer
            )
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
            lic_type = job_post['licenseType'] if 'licenseType' in job_post else None
            if lic_type is not None:
                lic = _get_user_app_license(lic_type, request.user)
                if lic is None:
                    raise ApiException("You are missing the required license for this application.")
                license_var = {
                    "key": "_license",
                    "value": lic.license_as_str()
                }
                if 'envVariables' in job_post['parameterSet']:
                    job_post['parameterSet']['envVariables'].append(license_var)
                else:
                    job_post['parameterSet']['envVariables'] = [license_var]
                del job_post['licenseType']

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

            response = tapis.jobs.submit(body=job_post)

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
        tapis = request.user.tapis_oauth.client
        data = tapis.jobs.getJobHistory(jobUuid=job_uuid)
        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )


@method_decorator(login_required, name='dispatch')
class AppsTrayView(BaseApiView):
    def getPrivateApps(self, user):
        tapis = user.tapis_oauth.client
        # TODOv3: make sure to exclude public apps
        apps_listing = tapis.apps.getApps(select="version,id,notes", search=f"(owner.eq.{user.username})~(enabled.eq.true)")
        my_apps = list(map(lambda app: {
            "label": getattr(app.notes, 'label', app.id),
            "version": app.version,
            "type": "tapis",
            "appId": app.id,
        }, apps_listing))

        return my_apps

    def getPublicApps(self, user):
        # TODOv3: make tapipy request for public apps to compare against apps in AppTrayEntry
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
                "htmlDefinitions": html_definitions
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
