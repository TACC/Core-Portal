from django.db.models import Q
from django.conf import settings
from pytas.http import TASClient
import logging

logger = logging.getLogger(__name__)


def list_to_model_queries(q_comps):
    query = None
    if len(q_comps) > 2:
        query = Q(first_name__icontains=' '.join(q_comps[:1]))
        query |= Q(first_name__icontains=' '.join(q_comps[:2]))
        query |= Q(last_name__icontains=' '.join(q_comps[1:]))
        query |= Q(last_name__icontains=' '.join(q_comps[2:]))
    else:
        query = Q(first_name__icontains=q_comps[0])
        query |= Q(last_name__icontains=q_comps[1])
    return query


def q_to_model_queries(q):
    if not q:
        return None

    query = None
    if ' ' in q:
        q_comps = q.split()
        query = list_to_model_queries(q_comps)
    else:
        query = Q(email__icontains=q)
        query |= Q(first_name__icontains=q)
        query |= Q(last_name__icontains=q)

    return query


def get_allocations(username):
    """Returns user allocations on TACC resources

    : returns: allocations
    : rtype: dict
    """

    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )
    tas_projects = tas_client.projects_for_user(username)

    # A dict for translating TAS allocation resources to hostnames
    tas_to_tacc_resources = {
        'Stampede4': {
            'name': 'Stampede 2',
            'host': 'stampede2.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Corral2': {
            'name': 'Corral',
            'host': 'data.tacc.utexas.edu',
            'type': 'STORAGE'
        },
        'Lonestar5': {
            'name': 'LoneStar 5',
            'host': 'ls5.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Maverick2': {
            'name': 'Maverick',
            'host': 'maverick.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Maverick3': {
            'name': 'Maverick 2',
            'host': 'maverick2.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Rodeo2': {
            'name': 'Rodeo',
            'host': 'rodeo.tacc.utexas.edu',
            'type': 'STORAGE'
        },
        'Wrangler': {
            'name': 'Wrangler',
            'host': 'wrangler.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Wrangler2': {
            'name': 'Wrangler',
            'host': 'wrangler.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Wrangler3': {
            'name': 'Wrangler',
            'host': 'wrangler.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Frontera': {
            'name': 'Frontera',
            'host': 'frontera.tacc.utexas.edu',
            'type': 'HPC'
        },
        'Ranch': {
            'name': 'Ranch',
            'host': 'ranch.tacc.utexas.edu',
            'type': 'STORAGE'
        },
        'Hikari': {
            'name': 'Hikari',
            'host': 'hikari.tacc.utexas.edu',
            'type': 'HPC'
        }
    }

    hosts = {}
    active_allocations = {}
    inactive_allocations = {}

    for tas_proj in tas_projects:
        # Each project from tas has an array of length 1 for its allocations
        alloc = tas_proj['allocations'][0]
        charge_code = tas_proj['chargeCode']
        if alloc['resource'] in tas_to_tacc_resources:
            resource = dict(tas_to_tacc_resources[alloc['resource']])
            resource['allocation'] = dict(alloc)

            if resource['host'] in hosts and charge_code not in hosts[resource['host']]:
                hosts[resource['host']].append(charge_code)
            elif resource['host'] not in hosts:
                hosts[resource['host']] = [charge_code]

            # Separate active and inactive allocations and make single entry for each project
            if resource['allocation']['status'] == 'Active':
                # Add allocations to the project listing if it exists
                if charge_code in active_allocations:
                    active_allocations[charge_code]['systems'].append(resource)
                # Begin the entry for each project here
                else:
                    active_allocations[charge_code] = {
                        'title': tas_proj['title'],
                        'projectId': tas_proj['id'],
                        'pi': '{} {}'.format(tas_proj['pi']['firstName'], tas_proj['pi']['lastName']),
                        'projectName': tas_proj['chargeCode'],
                        'systems': [resource]
                    }
            else:
                if charge_code in inactive_allocations:
                    inactive_allocations[charge_code]['systems'].append(resource)
                else:
                    inactive_allocations[charge_code] = {
                        'title': tas_proj['title'],
                        'projectId': tas_proj['id'],
                        'pi': '{} {}'.format(tas_proj['pi']['firstName'], tas_proj['pi']['lastName']),
                        'projectName': tas_proj['chargeCode'],
                        'systems': [resource]
                    }
    return {
        'hosts': hosts,
        'portal_alloc': settings.PORTAL_ALLOCATION,
        'active': list(active_allocations.values()),
        'inactive': list(inactive_allocations.values()),
    }


def get_usernames(project_id):
    """Returns list of project users

    : returns: usernames
    : rtype: list
    """
    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )
    usernames = tas_client.get_project_users(project_id=project_id)
    return usernames


def get_user_data(username):
    """Returns user contact information

    : returns: user_data
    : rtype: dict
    """
    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
            }
    )
    user_data = tas_client.get_user(username=username)
    return user_data
