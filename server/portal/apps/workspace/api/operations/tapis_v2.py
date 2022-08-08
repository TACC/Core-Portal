import logging
import json
from urllib.parse import urlparse
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.urls import reverse
from portal.utils.translations import get_jupyter_url
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.exceptions.api import ApiException
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.workspace.managers.user_applications import UserApplicationsManager
from portal.libs.agave.utils import service_account
from portal.apps.workspace.models import AppTrayCategory, AppTrayEntry, JobSubmission
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info
from portal.utils.translations import url_parse_inputs
from agavepy.agave import Agave

logger = logging.getLogger(__name__)

def _get_app(app_id, client, user):
    data = {'definition': client.apps.get(appId=app_id)}

    # GET EXECUTION SYSTEM INFO FOR USER APPS
    exec_sys = ExecutionSystem(client, data['definition']['executionSystem'])
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

def _app_license_type(app_id):
    app_lic_type = app_id.replace('-{}'.format(app_id.split('-')[-1]), '').upper()
    lic_type = next((t for t in LICENSE_TYPES if t in app_lic_type), None)
    return lic_type


def get_app(client, user, app_id):
    data = _get_app(app_id, client, user)

    if settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS:
        # check if default system needs keys pushed
        default_sys = UserSystemsManager(
            user,
            settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
        )
        storage_sys = StorageSystem(client, default_sys.get_system_id())
        success, result = storage_sys.test()
        data['systemHasKeys'] = success
        data['pushKeysSystem'] = storage_sys.to_dict()

    return data

def get_app_listing(client, public_only, name):
    list_kwargs = {}
    if public_only == 'true':
        list_kwargs['publicOnly'] = 'true'
    else:
        list_kwargs['privateOnly'] = True
    if name:
        list_kwargs['query'] = {
            "name": name
        }
    data = {'appListing': client.apps.list(**list_kwargs)}
    return data

def get_metadata_listing(client, user, app_id):
    query = json.dumps({
        '$and': [
            {'name': {'$in': settings.PORTAL_APPS_METADATA_NAMES}},
            {'value.definition.available': True},
            {'value.definition.id': app_id}
        ]
    })

    # data = agave.meta.listMetadata(q=query)
    data = client.meta.listMetadata(q=query)

    assert len(data) == 1, "Expected single app response, got {}.".format(len(data))
    data = data[0]

    lic_type = _app_license_type(app_id)
    data['license'] = {
        'type': lic_type
    }
    if lic_type is not None:
        _, license_models = get_license_info()
        license_model = [x for x in license_models if x.license_type == lic_type][0]
        lic = license_model.objects.filter(user=user).first()
        data['license']['enabled'] = lic is not None

    return data

def get_metadata_query_listing(client, query):
    if not query:
        query = json.dumps({
            '$and': [
                {'name': {'$in': settings.PORTAL_APPS_METADATA_NAMES}},
                {'value.definition.available': True}
            ]
        })
    # data = agave.meta.listMetadata(q=query)
    return client.meta.listMetadata(q=query)

def update_metadata(client, meta_uuid, meta_post):
    return client.meta.updateMetadata(uuid=meta_uuid, body=meta_post)

def create_metadata(client, meta_post):
    return client.meta.addMetadata(body=meta_post)

def delete_metadata(client, meta_uuid):
    return client.meta.deleteMetadata(uuid=meta_uuid)

def get_monitors_listing(target):
    admin_client = Agave(api_server=getattr(settings, 'AGAVE_TENANT_BASEURL'),
                            token=getattr(settings, 'AGAVE_SUPER_TOKEN'))
    return admin_client.monitors.list(target=target)

def get_job_history(client, job_uuid):
    return client.jobs.getHistory(jobId=job_uuid)

def get_jobs_listing(client, user, limit, offset, period):
    jobs = JobSubmission.objects.all().filter(user=user).order_by('-time')

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
        data = client.jobs.list(query={'id.in': ','.join(user_job_ids)})
        # re-order agave job info to match our time-ordered jobs
        # while also taking care that tapis in rare cases might no longer
        # have that job (see https://jira.tacc.utexas.edu/browse/FP-975)
        data = list(filter(None, [next((job for job in data if job["id"] == id), None) for id in user_job_ids]))
    else:
        data = []

    return data

def get_job(client, user, job_id):
    data = client.jobs.get(jobId=job_id)
    q = {"associationIds": job_id}
    job_meta = client.meta.listMetadata(q=json.dumps(q))
    data['_embedded'] = {"metadata": job_meta}

    # TODO: Decouple this from front end somehow
    archive_system = data.get('archiveSystem', None)
    if archive_system:
        archive_system_path = '{}/{}'.format(archive_system, data['archivePath'])
        data['archiveUrl'] = '/workbench/data-depot/'
        data['archiveUrl'] += 'agave/{}/'.format(archive_system_path.strip('/'))

        jupyter_url = get_jupyter_url(
            archive_system,
            "/" + data['archivePath'],
            user.username,
            is_dir=True
        )
        if jupyter_url:
            data['jupyterUrl'] = jupyter_url

    return data

def delete_job(client, job_id):
    return client.jobs.delete(jobId=job_id)

def resubmit_job(client, user, job_action, job_id):
    # resubmit job
    response = client.jobs.manage(jobId=job_id, body={"action": job_action})

    if job_action == 'resubmit':
        if "id" in response:
            job = JobSubmission.objects.create(
                user=user,
                jobId=response["id"]
            )
            job.save()

    return response

def submit_job(client, user, job_post, request):
    default_sys = UserSystemsManager(
        user,
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
        lic = license_model.objects.filter(user=user).first()
        if not lic:
            raise ApiException("You are missing the required license for this application.")
        job_post['parameters']['_license'] = lic.license_as_str()

    # url encode inputs
    if job_post['inputs']:
        job_post = url_parse_inputs(job_post)

    # Get or create application based on allocation and execution system
    apps_mgr = UserApplicationsManager(request.user)
    app = apps_mgr.get_or_create_app(job_post['appId'], job_post['allocation'])

    response = {"execSys": app.exec_sys.to_dict()}

    if app.exec_sys:
        return response

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

    response = client.jobs.submit(body=job_post)

    if "id" in response:
        job = JobSubmission.objects.create(
            user=user,
            jobId=response["id"]
        )
        job.save()
    return response 

def get_systems_roles_listing(system_id):
    agc = service_account()
    return agc.systems.listRoles(systemId=system_id)

def get_systems_user_role(system_id, user):
    agc = service_account()
    return agc.systems.getRoleForUser(systemId=system_id, username=user.username)

def update_role(system_id, role_body):
    agc = service_account()
    return agc.systems.updateRole(systemId=system_id, body=role_body)

def get_app_id_by_spec(app, user):
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
    app_list = agave.apps.list(query=query)
    app_list.sort(
        key=lambda app_def: [int(u) for u in app_def['version'].split('.')] + [int(app_def['revision'])]
    )
    return app_list[-1]['id']

def get_app_id(app, user):
    if app.appId and len(app.appId) > 0:
        app_id = app.appId
    else:
        app_id = get_app_id_by_spec(app, user)
    if app_id != app.lastRetrieved:
        app.lastRetrieved = app_id
        app.save()
    return app_id

def get_private_apps(user):
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

def get_public_apps(user):
    categories = []
    definitions = {}
    # Traverse category records in descending priority
    for category in AppTrayCategory.objects.all().order_by('-priority'):
        category_result = {
            "title": category.category,
            "apps": []
        }

        # Retrieve all apps known to the portal in that directory
        apps = AppTrayEntry.objects.all().filter(available=True, category=category)
        for app in apps:
            # Create something similar to the old metadata record
            app_record = {
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
                    app_record["appId"] = app.htmlId
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
                    app_id = get_app_id(app, user)
                    app_record["appId"] = app_id

                category_result["apps"].append(app_record)
            except Exception:
                logger.info("Could not retrieve app {}".format(app))

        category_result["apps"].sort(key=lambda app: app['label'])
        categories.append(category_result)

    return categories, definitions

def get_apps_tray(user):
    tabs, definitions = get_public_apps(user)
    my_apps = get_private_apps(user)
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

    return tabs, definitions
