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



def get_system_variables_from_project_entry(user, project_entry):
    templates = settings.PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES
    templateValues = templates[project_entry.template]
    additional_substitutions = {
        'projectid': project_entry.projectid,
        'projectname': project_entry.projectname,
        'projectdir': project_entry.projectdir
    }
    return substitute_user_variables(user, templateValues['systemId'], templateValues, additional_substitutions=additional_substitutions)


def index_project_systems(username, variable_mapping):
    tas_project_systems = {
        systemId: variables for systemId, variables in variable_mapping
    }
    doc = IndexedTasProjectSystems(username=username, value=tas_project_systems)
    doc.meta.id = get_sha256_hash(username)
    doc.save()


def retrieve_indexed_system_variables(username):
    tas_project_systems = {}
    cached = IndexedTasProjectSystems.from_username(username).value.to_dict()
    tas_project_systems.update(cached)
    return dict.items(tas_project_systems)


def get_tas_project_system_variables(user, force=False):
    assert settings.PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES
    username = user.username
    try:
        if force:
            logger.info("Forcing refresh of TAS Project Systems for user: {}".format(username))
            raise NotFoundError
        return retrieve_indexed_system_variables(username)
    except NotFoundError:
        project_ids = get_tas_project_ids(user.username)
        project_entries = []
        # Get all matching project entries definitions for a user based on their TAS project IDs
        for project_id in project_ids:
            project_entries += [project_entry for project_entry in TasProjectSystemEntry.objects.all().filter(project_sql_id=project_id)]
        # Generate system variables for use in system creation based off of matching project entries
        variable_mapping = [get_system_variables_from_project_entry(user, project_entry) for project_entry in project_entries]
        index_project_systems(username, variable_mapping)
        return variable_mapping


def get_datafiles_system_list(user):
    system_variables = get_tas_project_system_variables(user)
    return [
        {
            'name': system_variable[1]['name'],
            'system':  system_variable[1]['systemId'],
            'scheme': 'private',
            'api': 'tapis',
            'icon': system_variable[1]['icon'],
            'hidden': system_variable[1]['hidden'] if 'hidden' in system_variable else False
        } for system_variable in system_variables
    ]


def create_tas_project_systems(user):
    tas_project_systems = get_tas_project_system_variables(user, force=True)

    # Convert list of tuples to dictionary
    storage_systems = {
        systemId: variables for systemId, variables in tas_project_systems
    }
    logger.debug("Unpacking systems to create: {}".format(storage_systems))

    # Create a list of tuples of systemId, variables from substitute_user_variables
    substituted = [
        substitute_user_variables(user, v['systemId'], v) for k, v in storage_systems.items()
    ]

    for systemId, variables in substituted:
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
