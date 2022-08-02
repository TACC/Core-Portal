import logging
from django.conf import settings
from portal.apps.accounts.managers.user_systems import UserSystemsManager
from portal.libs.agave.models.systems.execution import ExecutionSystem
from portal.libs.agave.models.systems.storage import StorageSystem
from portal.apps.workspace.models import AppTrayCategory, AppTrayEntry
from portal.apps.licenses.models import LICENSE_TYPES, get_license_info

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

def get_applisting(client, public_only, name):
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
