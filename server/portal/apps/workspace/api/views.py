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
# from django.urls import reverse  # TODOv3
from django.db.models.functions import Coalesce
from django.core.exceptions import ObjectDoesNotExist
from tapipy.errors import BaseTapyException, InternalServerError
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info
from portal.libs.agave.utils import service_account
from portal.libs.agave.serializers import BaseTapisResultSerializer
# from portal.utils.translations import url_parse_inputs  # TODOv3
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.apps.workspace.models import AppTrayCategory, AppTrayEntry
from portal.apps.onboarding.steps.system_access_v3 import push_system_credentials
from .handlers.tapis_handlers import tapis_get_handler

logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


def _app_license_type(app_def):
    app_lic_type = getattr(app_def.notes, 'licenseType', None)
    lic_type = app_lic_type if app_lic_type in LICENSE_TYPES else None
    return lic_type


def _get_user_app_license(license_type, user):
    _, license_models = get_license_info()
    license_model = next((x for x in license_models if x.license_type == license_type), None)
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


def _test_listing_with_existing_keypair(system, user):
    # TODOv3: Add Tapis system test utility method with proper error handling
    tapis = user.tapis_oauth.client

    # Check for existing keypair stored for this hostname
    try:
        keys = user.ssh_keys.for_hostname(hostname=system.host)
        priv_key_str = keys.private_key()
        publ_key_str = keys.public
    except ObjectDoesNotExist:
        return False

    # Attempt listing a second time after credentials are added to system
    try:
        push_system_credentials(user, publ_key_str, priv_key_str, system.id)
        tapis.files.listFiles(systemId=system.id, path="/")
    except BaseTapyException:
        return False

    return True


@method_decorator(login_required, name='dispatch')
class AppsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        tapis = request.user.tapis_oauth.client
        app_id = request.GET.get('appId')
        if app_id:
            app_version = request.GET.get('appVersion')
            METRICS.debug("user:{} is requesting app id:{} version:{}".format(request.user.username, app_id, app_version))
            data = _get_app(app_id, app_version, request.user)

            if settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS and settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT:
                # check if default system needs keys pushed
                default_sys = UserSystemsManager(
                    request.user,
                    settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
                )
                system_id = default_sys.get_system_id()
                system_def = tapis.systems.getSystem(systemId=system_id)

                try:
                    tapis.files.listFiles(systemId=system_id, path="/")
                except InternalServerError:
                    success = _test_listing_with_existing_keypair(system_def, request.user)
                    data['systemNeedsKeys'] = not success
                    data['pushKeysSystem'] = system_def
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
            portal_name = settings.PORTAL_NAMESPACE

            data = tapis.jobs.getJobSearchList(
                limit=limit,
                startAfter=offset,
                orderBy='lastUpdated(desc),name(asc)',
                _tapis_query_parameters={'tags.contains': portal_name}
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

            # TODOv3: maybe better to do on frontend?
            # cleaning archive path value
            if job_post.get('archiveSystemDir'):
                parsed = urlparse(job_post['archiveSystemDir'])
                if parsed.path.startswith('/') and len(parsed.path) > 1:
                    # strip leading '/'
                    archive_path = parsed.path[1:]
                elif parsed.path == '':
                    # if path is blank, set to root of system
                    archive_path = '/'
                else:
                    archive_path = parsed.path

                job_post['archiveSystemDir'] = archive_path

                if parsed.netloc:
                    job_post['archiveSystemId'] = parsed.netloc
                else:
                    job_post['archiveSystemId'] = default_sys.get_system_id()
            else:
                job_post['archiveSystemDir'] = \
                    'archive/jobs/{}/${{JOB_NAME}}-${{JOB_ID}}'.format(
                        timezone.now().strftime('%Y-%m-%d'))
                job_post['archiveSystemId'] = default_sys.get_system_id()

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

            # Test file listing on relevant systems to determine whether keys need to be pushed manually
            for system_id in list(set([job_post['archiveSystemId'], job_post['execSystemId']])):
                system_def = tapis.systems.getSystem(system_id)
                try:
                    tapis.files.listFiles(systemId=system_id, path="/")
                except InternalServerError:
                    success = _test_listing_with_existing_keypair(system_def, request.user)
                    if not success:
                        logger.info(f"Keys for user {request.user.username} must be manually pushed to system: {system_id}")
                        return JsonResponse(
                            {
                                'status': 200,
                                'response': {"execSys": system_def},
                            },
                            encoder=BaseTapisResultSerializer
                        )

            if settings.DEBUG:
                wh_base_url = settings.WH_BASE_URL + '/webhooks/'
                # jobs_wh_url = settings.WH_BASE_URL + reverse('webhooks:jobs_wh_handler')
            else:
                wh_base_url = request.build_absolute_uri('/webhooks/')
                # jobs_wh_url = request.build_absolute_uri(reverse('webhooks:jobs_wh_handler'))

            job_post['parameterSet']['envVariables'] = job_post['parameterSet'].get('envVariables', []) + [{'key': '_webhook_base_url', 'value':  wh_base_url}]

            portal_name = settings.PORTAL_NAMESPACE
            job_post['tags'] = job_post.get('tags', []) + [portal_name]

            # TODOv3 Webhooks/notifications continues
            # job_post['notifications'] = [
            #     {'url': jobs_wh_url,
            #      'event': e}
            #     for e in settings.PORTAL_JOB_NOTIFICATION_STATES]

            response = tapis.jobs.submitJob(**job_post)
            return JsonResponse(
                {
                    'status': 200,
                    'response': response,
                },
                encoder=BaseTapisResultSerializer
            )


@method_decorator(login_required, name='dispatch')
class SystemsView(BaseApiView):

    def get(self, request, *args, **kwargs):
        roles = request.GET.get('roles')
        user_role = request.GET.get('user_role')
        system_id = request.GET.get('system_id')
        if roles:
            METRICS.info("user:{} tapis.systems.listRoles system_id:{}".format(request.user.username, system_id))
            agc = service_account()
            data = agc.systems.listRoles(systemId=system_id)
        elif user_role:
            METRICS.info("user:{} tapis.systems.getRoleForUser system_id:{}".format(request.user.username, system_id))
            agc = service_account()
            data = agc.systems.getRoleForUser(systemId=system_id, username=request.user.username)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        body = json.loads(request.body)
        role = body['role']
        system_id = body['system_id']
        METRICS.info("user:{} tapis.systems.updateRole system_id:{}".format(request.user.username, system_id))
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
        apps_listing = tapis.apps.getApps(select="version,id,notes", search="(enabled.eq.true)", listType="MINE")
        my_apps = list(map(lambda app: {
            "label": getattr(app.notes, 'label', app.id),
            "version": app.version,
            "type": "tapis",
            "appId": app.id,
        }, apps_listing))

        return my_apps

    def getPublicApps(self, user):
        tapis = user.tapis_oauth.client
        apps_listing = tapis.apps.getApps(select="version,id,notes", search="(enabled.eq.true)", listType="SHARED_PUBLIC")
        categories = []
        html_definitions = {}
        # Traverse category records in descending priority
        for category in AppTrayCategory.objects.all().order_by('-priority'):

            # Retrieve all apps known to the portal in that category
            tapis_apps = list(AppTrayEntry.objects.all().filter(available=True, category=category, appType='tapis')
                              .order_by(Coalesce('label', 'appId')).values('appId', 'appType', 'html', 'icon', 'label', 'version'))

            # Only return Tapis apps that are known to exist and are enabled
            tapis_apps = [x for x in tapis_apps if any(x['appId'] in [y.id, f'{y.id}-{y.version}'] for y in apps_listing)]

            html_apps = list(AppTrayEntry.objects.all().filter(available=True, category=category, appType='html')
                             .order_by(Coalesce('label', 'appId')).values('appId', 'appType', 'html', 'icon', 'label', 'version'))

            categoryResult = {
                "title": category.category,
                "apps": [{k: v for k, v in tapis_app.items() if v != ''} for tapis_app in tapis_apps]  # Remove empty strings from response
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
