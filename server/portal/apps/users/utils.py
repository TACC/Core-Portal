from django.db.models import Q
from django.conf import settings
from pytas.http import TASClient
from portal.libs.elasticsearch.docs.base import IndexedAllocation
from elasticsearch.exceptions import NotFoundError
from portal.libs.elasticsearch.utils import get_sha256_hash
import json
import logging
import requests

from portal.exceptions.api import ApiException
from portal.apps.search.tasks import index_allocations

logger = logging.getLogger(__name__)


def get_tas_client():
    """Return a TAS Client with pytas"""
    return TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )


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
        query |= Q(username__icontains=q)

    return query


def get_tas_allocations(username):
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

    with open('portal/apps/users/tas_to_tacc_resources.json') as f:
        tas_to_tacc_resources = json.load(f)

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

            # Separate active and inactive allocations and make single entry for each project
            if resource['allocation']['status'] == 'Active':
                if resource['host'] in hosts and charge_code not in hosts[resource['host']]:
                    hosts[resource['host']].append(charge_code)
                elif resource['host'] not in hosts:
                    hosts[resource['host']] = [charge_code]
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
        'inactive': list(inactive_allocations.values())
    }


def get_allocations(username, force=False):
    """
    Returns indexed allocation data cached in Elasticsearch, or fetches
    allocations from TAS and indexes them if not cached yet.
    Parameters
        ----------
        username: str
            TACC username to fetch allocations for.
        Returns
        -------
        dict
    """
    try:
        if force:
            logger.info("Forcing TAS allocation retrieval for user:{}".format(username))
            raise NotFoundError
        index_allocations.apply_async(args=[username])
        result = {
            'hosts': {},
            'portal_alloc': None,
            'active': [],
            'inactive': []
        }
        result.update(IndexedAllocation.from_username(username).value.to_dict())
        return result
    except NotFoundError:
        # Fall back to getting allocations from TAS
        allocations = get_tas_allocations(username)
        doc = IndexedAllocation(username=username, value=allocations)
        doc.meta.id = get_sha256_hash(username)
        doc.save()
        return allocations


def get_project_users_from_name(project_name):
    """Returns list of project users

    : returns: usernames
    : rtype: list
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get('{0}/v1/projects/name/{1}/users'.format(settings.TAS_URL, project_name), auth=auth)
    resp = r.json()
    if resp['status'] == 'success':
        return resp['result']
    else:
        raise ApiException('Failed to get project users', resp['message'])


def get_project_users_from_id(project_id):
    """Returns list of project users

    : returns: usernames
    : rtype: list
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get('{0}/v1/projects/{1}/users'.format(settings.TAS_URL, project_id), auth=auth)
    resp = r.json()
    if resp['status'] == 'success':
        return resp['result']
    else:
        raise ApiException('Failed to get project users', resp['message'])


def get_project_from_name(project_name):
    """Returns a project dictionary object given a Project Name

    : returns: project
    : rtype: dict
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get('{0}/v1/projects/name/{1}'.format(settings.TAS_URL, project_name), auth=auth)
    resp = r.json()
    if resp['status'] == 'success':
        return resp['result']
    else:
        raise ApiException('Failed to get project', resp['message'])


def get_project_from_id(project_id):
    """Returns a project dictionary object given a Project ID

    : returns: project
    : rtype: dict
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get('{0}/v1/projects/{1}'.format(settings.TAS_URL, project_id), auth=auth)
    resp = r.json()
    if resp['status'] == 'success':
        return resp['result']
    else:
        raise ApiException('Failed to get project', resp['message'])


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


def get_per_user_allocation_usage(allocation_id):
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get('{0}/v1/allocations/{1}/usage'.format(settings.TAS_URL, allocation_id), auth=auth)
    resp = r.json()
    if resp['status'] == 'success':
        return resp['result']
    else:
        raise ApiException('Failed to get project users: {}'.format(resp['message']))


def add_user(project_id, user_id):
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    uri = '{0}/v1/projects/{1}/users/{2}'.format(settings.TAS_URL, project_id, user_id)
    r = requests.post(uri, auth=auth)
    resp = r.json()
    if resp['status'] != 'success':
        raise ApiException("Failed to add user: '{}'".format(resp['message']))
    return resp['result']


def remove_user(project_id, user_id):
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.delete('{0}/v1/projects/{1}/users/{2}'.format(settings.TAS_URL, project_id, user_id), auth=auth)
    resp = r.json()
    if resp['status'] != 'success':
        raise ApiException("Failed to delete user: '{}'".format(resp['message']))
    return resp['result']


def check_user_groups(username, groups):
    try:
        return any(
            user['username'] == str(username)
            for group in groups for user in get_project_users_from_name(group)
        )
    except Exception as e:
        logger.error("Issue checking user groups for user:{} which failed with the following exception:{}".format(username, e))
        return False
