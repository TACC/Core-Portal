"""
.. :module:: apps.workspace.api.views
   :synopsys: Views to handle Workspace API
"""
import logging
import json
from urllib.parse import urlparse
from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.urls import reverse
from django.db.models.functions import Coalesce
from django.core.exceptions import PermissionDenied
from tapipy.tapis import TapisResult
from portal.views.base import BaseApiView
from portal.exceptions.api import ApiException
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info
from portal.libs.agave.utils import service_account
from portal.libs.agave.serializers import BaseTapisResultSerializer

# TODOv3: dropV2Jobs
from portal.apps.workspace.models import JobSubmission
from portal.apps.workspace.models import AppTrayCategory, AppTrayEntry
from portal.apps.users.utils import get_user_data
from .handlers.tapis_handlers import tapis_get_handler
from portal.apps.workspace.api.utils import (
    check_job_for_timeout,
    push_keys_required_if_not_credentials_ensured
)
from portal.utils import get_client_ip


logger = logging.getLogger(__name__)
METRICS = logging.getLogger('metrics.{}'.format(__name__))


def _app_license_type(app_def):
    app_lic_type = getattr(app_def.notes, "licenseType", None)
    lic_type = app_lic_type if app_lic_type in LICENSE_TYPES else None
    return lic_type


def _get_user_app_license(license_type, user):
    _, license_models = get_license_info()
    license_model = next((x for x in license_models if x.license_type == license_type), None)
    if not license_model:
        return None
    lic = license_model.objects.filter(user=user).first()
    return lic


def _get_exec_systems(user, systems):
    """List of all enabled execution systems available for the user."""
    tapis = user.tapis_oauth.client
    search_string = "(canExec.eq.true)~(enabled.eq.true)"
    if systems != ["All"]:
        system_id_search = ','.join(systems)
        search_string = f"(id.in.{system_id_search})~{search_string}"
    return tapis.systems.getSystems(listType="ALL", select="allAttributes", search=search_string)


def _get_app(app_id, app_version, user):
    tapis = user.tapis_oauth.client
    if app_version:
        app_def = tapis.apps.getApp(appId=app_id, appVersion=app_version)
    else:
        app_def = tapis.apps.getAppLatestVersion(appId=app_id)

    data = {'definition': app_def}

    exec_systems = getattr(app_def.notes, 'dynamicExecSystems', [])
    if len(exec_systems) > 0:
        data['execSystems'] = _get_exec_systems(user, exec_systems)
    else:
        # GET EXECUTION SYSTEM INFO TO PROCESS SPECIFIC SYSTEM DATA E.G. QUEUE INFORMATION
        data['execSystems'] = [tapis.systems.getSystem(systemId=app_def.jobAttributes.execSystemId)]

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
        if app_id:
            METRICS.info(
                "Apps",
                extra={
                    "user": request.user.username,
                    "sessionId": getattr(request.session, "session_key", ""),
                    "operation": "getApp",
                    "agent": request.META.get("HTTP_USER_AGENT"),
                    "ip": get_client_ip(request),
                    "info": {"query": request.GET.dict()},
                },
            )
            app_version = request.GET.get('appVersion')
            data = _get_app(app_id, app_version, request.user)

            # Check if default storage system needs keys pushed
            if settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM:
                system_id = settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM['system']
                if push_keys_required_if_not_credentials_ensured(request.user, system_id, '/'):
                    system_def = tapis.systems.getSystem(systemId=system_id)
                    data['systemNeedsKeys'] = True
                    data['pushKeysSystem'] = system_def

        else:
            METRICS.info(
                "Apps",
                extra={
                    "user": request.user.username,
                    "sessionId": getattr(request.session, "session_key", ""),
                    "operation": "getApps",
                    "agent": request.META.get("HTTP_USER_AGENT"),
                    "ip": get_client_ip(request),
                    "info": {"query": request.GET.dict()},
                },
            )
            data = {'appListing': tapis.apps.getApps()}

        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )


# TODOv3: dropV2Jobs
@method_decorator(login_required, name='dispatch')
class HistoricJobsView(BaseApiView):
    def get(self, request, *args, **kwargs):
        limit = int(request.GET.get('limit', 10))
        offset = int(request.GET.get('offset', 0))

        jobs = JobSubmission.objects.all().filter(user=request.user).exclude(data__isnull=True).order_by('-time')
        data = [job.data for job in jobs[offset:offset + limit]]

        return JsonResponse({"response": data})


@method_decorator(login_required, name='dispatch')
class JobsView(BaseApiView):

    def get(self, request, operation=None):

        allowed_actions = ['listing', 'search', 'select']

        tapis = request.user.tapis_oauth.client

        if operation not in allowed_actions:
            raise PermissionDenied

        METRICS.info(
            "Jobs",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": operation,
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )

        op = getattr(self, operation)
        data = op(tapis, request)

        if (isinstance(data, list)):
            for index, job in enumerate(data):
                data[index] = check_job_for_timeout(job)
        else:
            data = check_job_for_timeout(data)

        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )

    def select(self, client, request):
        job_uuid = request.GET.get('job_uuid')
        data = client.jobs.getJob(jobUuid=job_uuid, headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"})

        return data

    def listing(self, client, request):
        limit = int(request.GET.get('limit', 10))
        offset = int(request.GET.get('offset', 0))
        portal_name = settings.PORTAL_NAMESPACE

        data = client.jobs.getJobSearchList(
            limit=limit,
            skip=offset,
            orderBy='lastUpdated(desc),name(asc)',
            _tapis_query_parameters={'tags.contains': f'portalName: {portal_name}'},
            select='allAttributes', headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"}
        )

        return data

    def search(self, client, request):
        '''
        Search using tapis in specific portal with providing query string.
        Additonal parameters for search:
        limit - limit param from request, otherwise default to 10
        offset - offset param from request, otherwise default to 0
        '''
        query_string = request.GET.get('query_string')

        limit = int(request.GET.get('limit', 10))
        offset = int(request.GET.get('offset', 0))
        portal_name = settings.PORTAL_NAMESPACE

        sql_queries = [
            f"(tags IN ('portalName: {portal_name}')) AND",
            f"((name like '%{query_string}%') OR",
            f"(archiveSystemDir like '%{query_string}%') OR",
            f"(appId like '%{query_string}%') OR",
            f"(archiveSystemId like '%{query_string}%'))",
        ]

        data = client.jobs.getJobSearchListByPostSqlStr(
            limit=limit,
            startAfter=offset,
            orderBy='lastUpdated(desc),name(asc)',
            request_body={
                "search": sql_queries
            },
            select="allAttributes", headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"}
        )
        return data

    def delete(self, request, *args, **kwargs):
        METRICS.info(
            "Jobs",
            extra={
                "user": request.user.username,
                "sessionId": getattr(request.session, "session_key", ""),
                "operation": "delete",
                "agent": request.META.get("HTTP_USER_AGENT"),
                "ip": get_client_ip(request),
                "info": {"query": request.GET.dict()},
            },
        )
        tapis = request.user.tapis_oauth.client
        job_uuid = request.GET.get('job_uuid')
        data = tapis.jobs.hideJob(jobUuid=job_uuid, headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"})
        return JsonResponse(
            {
                'status': 200,
                'response': data,
            },
            encoder=BaseTapisResultSerializer
        )

    def post(self, request, *args, **kwargs):
        tapis = request.user.tapis_oauth.client
        username = request.user.username
        body = json.loads(request.body)
        job_uuid = body.get('job_uuid')
        job_action = body.get('action')
        job_post = body.get('job')

        if job_uuid and job_action:
            if job_action == 'resubmit':
                logger.info("user:{} is resubmitting job uuid:{}".format(username, job_uuid))
                data = tapis.jobs.resubmitJob(jobUuid=job_uuid, headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"})
                if isinstance(data, TapisResult):
                    metrics_info = {
                        "body": body,
                    }
                    response_uuid = data.get("uuid", None)
                    if response_uuid:
                        metrics_info["response_uuid"] = response_uuid
                    METRICS.info(
                        "Jobs",
                        extra={
                            "user": username,
                            "sessionId": getattr(request.session, "session_key", ""),
                            "operation": "resubmitJob",
                            "agent": request.META.get("HTTP_USER_AGENT"),
                            "ip": get_client_ip(request),
                            "info": metrics_info,
                        },
                    )

            elif job_action == 'cancel':
                logger.info("user:{} is canceling/stopping job uuid:{}".format(username, job_uuid))
                data = tapis.jobs.cancelJob(jobUuid=job_uuid, headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"})
                if isinstance(data, TapisResult):
                    metrics_info = {
                        "body": body,
                    }
                    response_uuid = data.get("uuid", None)
                    if response_uuid:
                        metrics_info["response_uuid"] = response_uuid
                    METRICS.info(
                        "Jobs",
                        extra={
                            "user": username,
                            "sessionId": getattr(request.session, "session_key", ""),
                            "operation": "cancelJob",
                            "agent": request.META.get("HTTP_USER_AGENT"),
                            "ip": get_client_ip(request),
                            "info": metrics_info,
                        },
                    )
            else:
                raise ApiException("user:{} is trying to run an unsupported job action: {} for job uuid: {}".format(
                    username,
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

        elif not job_post:
            raise ApiException("user:{} is submitting a request with no job body.".format(
                username,
            ), status=400)

        # submit job
        else:
            logger.info("processing job submission for user:{}: {}".format(username, job_post))

            # Provide default job archive configuration if none is provided and portal has default system
            if settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM:
                if not job_post.get('archiveSystemId'):
                    job_post['archiveSystemId'] = settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM['system']
                if not job_post.get('archiveSystemDir'):
                    tasdir = get_user_data(username)['homeDirectory']
                    homeDir = settings.PORTAL_DATAFILES_DEFAULT_STORAGE_SYSTEM['homeDir'].format(tasdir=tasdir, username=username)
                    job_post['archiveSystemDir'] = f'{homeDir}/tapis-jobs-archive/${{JobCreateDate}}/${{JobName}}-${{JobUUID}}'

            execSystemId = job_post.get("execSystemId")
            if not execSystemId:
                app = _get_app(job_post["appId"], job_post["appVersion"], request.user)
                execSystemId = app["definition"].jobAttributes.execSystemId

            if not job_post.get("appVersion"):
                app = _get_app(job_post["appId"], None, request.user)
                job_post["appVersion"] = app["definition"].version

            # Check for and set license environment variable if app requires one
            lic_type = body.get('licenseType')
            if lic_type:
                lic = _get_user_app_license(lic_type, request.user)
                if lic is None:
                    raise ApiException("You are missing the required license for this application.")

                # TODOv3: Multistring licenses break environment variables. Determine how to handle multistring licenses, if needed at all.
                # https://jira.tacc.utexas.edu/browse/WP-70
                # license_var = {
                #     "key": "_license",
                #     "value": lic.license_as_str()
                # }
                # job_post['parameterSet']['envVariables'] = job_post['parameterSet'].get('envVariables', []) + [license_var]

            # Test file listing on relevant systems to determine whether keys need to be pushed manually
            for system_id in list(set([job_post["archiveSystemId"], execSystemId])):
                if push_keys_required_if_not_credentials_ensured(request.user, system_id):
                    system_def = tapis.systems.getSystem(systemId=system_id)
                    return JsonResponse(
                        {
                            "status": 200,
                            "response": {"execSys": system_def},
                        },
                        encoder=BaseTapisResultSerializer,
                    )

            if settings.DEBUG:
                webhook_url = getattr(settings, "NGROK_DOMAIN", None) or getattr(settings, "WH_BASE_URL", "")
                parsed_url = urlparse(webhook_url)
                if not parsed_url.scheme:
                    webhook_base_url = f"https://{webhook_url}"
                else:
                    webhook_base_url = settings.NGROK_DOMAIN

                interactive_wh_url = webhook_base_url + reverse("webhooks:interactive_wh_handler")
                jobs_wh_url = webhook_base_url + reverse("webhooks:jobs_wh_handler")
            else:
                interactive_wh_url = request.build_absolute_uri(reverse("webhooks:interactive_wh_handler"))
                jobs_wh_url = request.build_absolute_uri(reverse("webhooks:jobs_wh_handler"))

            # Add additional data for interactive apps
            if body.get('isInteractive'):
                # Add webhook URL environment variable for interactive apps
                job_post["parameterSet"]["envVariables"] = job_post["parameterSet"].get(
                    "envVariables", []
                ) + [{"key": "_INTERACTIVE_WEBHOOK_URL", "value": interactive_wh_url}]

                # Make sure $HOME/.tap directory exists for user when running interactive apps
                system = next((v for k, v in settings.TACC_EXEC_SYSTEMS.items() if execSystemId.endswith(k)), None)
                tasdir = get_user_data(username)['homeDirectory']
                if system:
                    tapis.files.mkdir(systemId=execSystemId, path=f"{system['home_dir'].format(tasdir)}/.tap")

            # Add portalName tag to job in order to filter jobs by portal
            portal_name = settings.PORTAL_NAMESPACE
            job_post['tags'] = job_post.get('tags', []) + [f'portalName: {portal_name}']

            # Add webhook subscription for job status updates
            job_post["subscriptions"] = job_post.get('subscriptions', []) + [
               {
                    "description": "Portal job status notification",
                    "enabled": True,
                    "eventCategoryFilter": "JOB_NEW_STATUS",
                    "ttlMinutes": 0,  # ttlMinutes of 0 corresponds to max default (1 week)
                    "deliveryTargets": [
                        {
                            "deliveryMethod": "WEBHOOK",
                            "deliveryAddress": jobs_wh_url
                        }
                    ]
                }
            ]

            logger.info("user:{} is submitting job:{}".format(username, job_post))
            response = tapis.jobs.submitJob(**job_post, headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"})

            if isinstance(response, TapisResult):
                metrics_info = {
                    "body": body,
                }
                response_uuid = response.get("uuid", None)
                if response_uuid:
                    metrics_info["response_uuid"] = response_uuid
                METRICS.info(
                    "Jobs",
                    extra={
                        "user": username,
                        "sessionId": getattr(request.session, "session_key", ""),
                        "operation": "submitJob",
                        "agent": request.META.get("HTTP_USER_AGENT"),
                        "ip": get_client_ip(request),
                        "info": metrics_info,
                    },
                )

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
            logger.info("user:{} tapis.systems.listRoles system_id:{}".format(request.user.username, system_id))
            agc = service_account()
            data = agc.systems.listRoles(systemId=system_id)
        elif user_role:
            logger.info("user:{} tapis.systems.getRoleForUser system_id:{}".format(request.user.username, system_id))
            agc = service_account()
            data = agc.systems.getRoleForUser(systemId=system_id, username=request.user.username)
        return JsonResponse({"response": data})

    def post(self, request, *args, **kwargs):
        body = json.loads(request.body)
        role = body['role']
        system_id = body['system_id']
        logger.info("user:{} tapis.systems.updateRole system_id:{}".format(request.user.username, system_id))
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
        data = tapis.jobs.getJobHistory(jobUuid=job_uuid, headers={"X-Tapis-Tracking-ID": f"portals.{request.session.session_key}"})
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
        # Only shows enabled versions of apps
        apps_listing = tapis.apps.getApps(
            select="version,id,notes",
            search="(versionEnabled.eq.true)~(enabled.eq.true)",
            listType="MINE",
            limit=-1,
        )
        my_apps = list(map(lambda app: {
            "label": getattr(app.notes, 'label', app.id),
            "version": app.version,
            "type": "tapis",
            "appId": app.id,
        }, apps_listing))

        return my_apps

    def getPublicApps(self, user):
        tapis = user.tapis_oauth.client
        # Only shows enabled versions of apps
        apps_listing = tapis.apps.getApps(
            select="version,id,notes",
            search="(versionEnabled.eq.true)~(enabled.eq.true)~(version.like.*)",
            listType="SHARED_PUBLIC",
            limit=-1,
        )
        categories = []
        html_definitions = {}
        # Traverse category records in descending priority
        for category in AppTrayCategory.objects.all().order_by('-priority'):

            # Retrieve all apps known to the portal in that category
            portal_apps = list(AppTrayEntry.objects.all().filter(available=True, category=category, appType='tapis')
                               .order_by(Coalesce('label', 'appId')).values('appId', 'appType', 'html', 'icon', 'label', 'version'))

            # Only return Tapis apps that are known to exist and are enabled
            tapis_apps = []
            for portal_app in portal_apps:
                portal_app_id = (portal_app['appId'], portal_app['version']) if portal_app['version'] else portal_app['appId']

                # Look for matching app in tapis apps list, and append tapis app label if portal app has no label
                matching_app = next((x for x in sorted(apps_listing, key=lambda y: y.version) if portal_app_id in [x.id, (x.id, x.version)]), None)
                if matching_app:
                    tapis_apps.append({**portal_app, 'label': portal_app['label'] or matching_app.notes.label})

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

            categoryResult["apps"] = sorted(categoryResult["apps"], key=lambda app: app['label'] or app['appId'])
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
        logger.info('user:%s op:%s query_params:%s' % (request.user.username, operation, get_params))
        response = tapis_get_handler(client, operation, **get_params)

        return JsonResponse({'data': response})
