from pytas.http import TASClient
from django.conf import settings
from portal.apps.tas_project_systems.models import TasProjectSystemEntry
from portal.apps.system_creation.utils import (
    substitute_user_variables
)

def get_tas_project_ids(username):
    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )
    return list(set([ project['id'] for project in tas_client.projects_for_user(username) ]))


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
    # Get all matching project system definitions for a user
    for project_id in project_ids:
        project_entries += [ project_entry for project_entry in TasProjectSystemEntry.objects.all().filter(project_sql_id=project_id) ]
    return [ get_system_variables_from_project_entry(user, project_entry) for project_entry in project_entries ]


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