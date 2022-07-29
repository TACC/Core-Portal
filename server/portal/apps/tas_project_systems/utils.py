from pytas.http import TASClient
from django.conf import settings
from portal.apps.tas_project_systems.models import TasProjectSystemEntry
from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.system_creation.utils import (
    call_reactor,
    substitute_user_variables
)
from elasticsearch.exceptions import NotFoundError
import logging
from portal.libs.elasticsearch.docs.base import IndexedTasProjectSystems
from portal.libs.elasticsearch.utils import get_sha256_hash
from celery import shared_task
from django.contrib.auth import get_user_model
import json

logger = logging.getLogger(__name__)


def get_tas_project_ids(username):
    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )
    return list(set([project['id'] for project in tas_client.projects_for_user(username)]))


def get_system_variables_from_project_sql_id(user, project_sql_id):
    """
    Get all project entries that match a specific Project SQL ID and return
    a dictionary of system variables
    """
    result = {}
    templates = settings.PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES
    project_entries = TasProjectSystemEntry.objects.all().filter(project_sql_id=project_sql_id)
    for project_entry in project_entries:
        templateValues = templates[project_entry.template]
        additional_substitutions = {
            'projectid': project_entry.projectid,
            'projectname': project_entry.projectname,
            'projectdir': project_entry.projectdir
        }
        systemId, variables = substitute_user_variables(
            user, templateValues['systemId'],
            templateValues,
            additional_substitutions=additional_substitutions
        )
        result[systemId] = variables
    return result


def cache_project_systems(username, tas_project_systems):
    """
    Save a dictionary of system variables to elasticsearch
    """
    doc = IndexedTasProjectSystems(username=username, value=tas_project_systems)
    doc.meta.id = get_sha256_hash(username)
    doc.save()


def update_cached_project_systems(username, tas_project_systems):
    """
    Merge a dictionary of system variables into a user's record of system varaibles in elasticsearch
    """
    merged = {}
    try:
        cached = retrieve_cached_system_variables(username)
        merged.update(cached)
    except NotFoundError:
        pass
        merged.update(tas_project_systems)
    merged.update(tas_project_systems)
    cache_project_systems(username, merged)


def retrieve_cached_system_variables(username):
    """
    Retrieve a dictionary of any system variables cached in elasticsearch
    """
    tas_project_systems = {}
    cached = IndexedTasProjectSystems.from_username(username).value.to_dict()
    tas_project_systems.update(cached)
    return tas_project_systems


def get_tas_project_system_variables(user, force=False):
    """
    Get a dictionary of TAS project system variable mappings, first looking for a pre-existing
    dictionary for a user in the elasticsearch cache
    """
    assert settings.PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES
    username = user.username
    try:
        if force:
            logger.info("Forcing refresh of TAS Project Systems for user: {}".format(username))
            raise NotFoundError
        return retrieve_cached_system_variables(username)
    except NotFoundError:
        project_sql_ids = get_tas_project_ids(user.username)
        tas_project_systems = {}
        for project_sql_id in project_sql_ids:
            tas_project_systems.update(get_system_variables_from_project_sql_id(user, project_sql_id))
        cache_project_systems(user.username, tas_project_systems)
        return tas_project_systems


def get_datafiles_system_list(user):
    """
    Transform the dictionary of TAS Project System variable into something Data Files understands
    """
    system_variables = dict.values(get_tas_project_system_variables(user))
    return [
        {
            'name': system_variable['name'],
            'system':  system_variable['systemId'],
            'scheme': 'private',
            'api': 'tapis',
            'icon': system_variable['icon'],
            'hidden': system_variable['hidden'] if 'hidden' in system_variable else False
        } for system_variable in system_variables
    ]


def create_systems(user, tas_project_systems):
    """
    Run system creation via key service reactor with callbacks on the given dictionary of systems
    """
    for systemId, variables in dict.items(tas_project_systems):
        logger.debug("Calling system creation reactor for {} with {}".format(systemId, variables))
        result = call_reactor(
            user,
            systemId,
            'wma-storage',
            variables,
            force=True,
            dryrun=False,
            callback="portal.apps.tas_project_systems.utils.ForceTasProjectSystemCreationCallback",
            callback_data={"systemId": systemId}
        )
        logger.info(
            "Forced System Creation reactor for {} has executionId {}".format(
                systemId,
                result['executionId']
            )
        )


@shared_task()
def reset_cached_systems_for_username(username):
    """
    Recomputes the cached records of any TAS project systems associated with the project_sql_id
    This DOES NOT delete the actual TAPIS system
    """
    try:
        user = get_user_model().objects.get(username=username)
    except:
        logger.error("User {} not found".format(username))
        return
    get_tas_project_system_variables(user, force=True)


@shared_task()
def create_systems_for_tas_project(username, project_sql_id):
    """
    Given a username and project_sql_id, force re-create TAS Project Systems associated
    with a specific project_sql_id
    """
    try:
        user = get_user_model().objects.get(username=username)
    except:
        logger.error("User {} not found".format(username))
        return
    # Verify the user is on this TAS Project
    project_ids = get_tas_project_ids(username)
    if project_sql_id not in project_ids:
        logger.error("User {} is not a member of TAS Project {}".format(username, project_sql_id))
        return
    # Get updated systems
    updated_systems = get_system_variables_from_project_sql_id(user, project_sql_id)
    update_cached_project_systems(username, updated_systems)
    # Fire off system creation
    create_systems(user, updated_systems)


@shared_task()
def create_all_tas_project_systems(username):
    """
    Given a username, force re-create all TAS project systems for them    
    """
    user = get_user_model().objects.get(username=username)
    tas_project_systems = get_tas_project_system_variables(user, force=True)
    # Fire off system creation
    create_systems(user, tas_project_systems)


class ForceTasProjectSystemCreationCallback(WebhookCallback):
    logger = logging.getLogger(__name__)

    def __init__(self):
        super(ForceTasProjectSystemCreationCallback, self).__init__()

    def callback(self, external_call, webhook_request):
        response = json.loads(webhook_request.body)
        self.logger.info("Forced TAS Project System Creation of {systemId} {result}".format(
            result=response['result'],
            systemId=external_call.callback_data['systemId'],
        ))
