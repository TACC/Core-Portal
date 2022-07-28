from pytas.http import TASClient
from django.conf import settings
from portal.apps.tas_project_systems.models import TasProjectSystemEntry
from portal.apps.system_creation.utils import (
    substitute_user_variables
)
from elasticsearch.exceptions import NotFoundError
import logging
from portal.libs.elasticsearch.docs.base import IndexedTasProjects
from portal.libs.elasticsearch.utils import get_sha256_hash

logger = logging.getLogger(__name__)


def get_tas_project_ids(username, force=False):
    result = {
        'tas_projects': []
    }
    try:
        if force:
            logger.info("Forcing TAS project retrieval for user:{}".format(username))
            raise NotFoundError
        cached = IndexedTasProjects.from_username(username).value.to_dict()
        result.update(cached)
        return result['tas_projects']
    except NotFoundError:
        # Fall back to getting projects from TAS
        tas_client = TASClient(
            baseURL=settings.TAS_URL,
            credentials={
                'username': settings.TAS_CLIENT_KEY,
                'password': settings.TAS_CLIENT_SECRET
            }
        )
        result['tas_projects'] = list(set([project['id'] for project in tas_client.projects_for_user(username)]))
        doc = IndexedTasProjects(username=username, value=result)
        doc.meta.id = get_sha256_hash(username)
        doc.save()
    return result['tas_projects']


def get_system_variables_from_project_entry(user, project_entry):
    templates = settings.PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES
    templateValues = templates[project_entry.template]
    additional_substitutions = {
        'projectname': project_entry.projectname,
        'projectdir': project_entry.projectdir
    }
    return substitute_user_variables(user, templateValues['systemId'], templateValues, additional_substitutions=additional_substitutions)


def get_tas_project_system_variables(user):
    project_ids = get_tas_project_ids(user.username)
    project_entries = []
    # Get all matching project entries definitions for a user based on their TAS project IDs
    for project_id in project_ids:
        project_entries += [project_entry for project_entry in TasProjectSystemEntry.objects.all().filter(project_sql_id=project_id)]
    # Generate system variables for use in system creation based off of matching project entries
    return [get_system_variables_from_project_entry(user, project_entry) for project_entry in project_entries]


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
