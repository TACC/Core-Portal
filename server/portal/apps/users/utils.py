import logging

import requests
from django.conf import settings
from django.db.models import Q
from elasticsearch.exceptions import NotFoundError
from pytas.http import TASClient

from portal.exceptions.api import ApiException
from portal.libs.elasticsearch.docs.base import IndexedAllocation
from portal.libs.elasticsearch.utils import get_sha256_hash

from .tasks import get_tas_allocations, index_allocations

logger = logging.getLogger(__name__)


def list_to_model_queries(q_comps):
    query = None
    if len(q_comps) > 2:
        query = Q(first_name__icontains=" ".join(q_comps[:1]))
        query |= Q(first_name__icontains=" ".join(q_comps[:2]))
        query |= Q(last_name__icontains=" ".join(q_comps[1:]))
        query |= Q(last_name__icontains=" ".join(q_comps[2:]))
    else:
        query = Q(first_name__icontains=q_comps[0])
        query |= Q(last_name__icontains=q_comps[1])
    return query


def q_to_model_queries(q):
    if not q:
        return None

    query = None
    if " " in q:
        q_comps = q.split()
        query = list_to_model_queries(q_comps)
    else:
        query = Q(email__icontains=q)
        query |= Q(first_name__icontains=q)
        query |= Q(last_name__icontains=q)
        query |= Q(username__icontains=q)

    return query


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
            logger.info(f"Forcing TAS allocation retrieval for user:{username}")
            raise NotFoundError
        result = {"hosts": {}, "portal_alloc": None, "active": [], "inactive": []}
        result.update(IndexedAllocation.from_username(username).value.to_dict())
        index_allocations.apply_async(args=[username])
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
    r = requests.get(f"{settings.TAS_URL}/v1/projects/name/{project_name}/users", auth=auth)
    resp = r.json()
    if resp["status"] == "success":
        return resp["result"]
    else:
        raise ApiException("Failed to get project users", resp["message"])


def get_project_users_from_id(project_id):
    """Returns list of project users

    : returns: usernames
    : rtype: list
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get(f"{settings.TAS_URL}/v1/projects/{project_id}/users", auth=auth)
    resp = r.json()
    if resp["status"] == "success":
        return resp["result"]
    else:
        raise ApiException("Failed to get project users", resp["message"])


def get_project_from_name(project_name):
    """Returns a project dictionary object given a Project Name

    : returns: project
    : rtype: dict
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get(f"{settings.TAS_URL}/v1/projects/name/{project_name}", auth=auth)
    resp = r.json()
    if resp["status"] == "success":
        return resp["result"]
    else:
        raise ApiException("Failed to get project", resp["message"])


def get_project_from_id(project_id):
    """Returns a project dictionary object given a Project ID

    : returns: project
    : rtype: dict
    """
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get(f"{settings.TAS_URL}/v1/projects/{project_id}", auth=auth)
    resp = r.json()
    if resp["status"] == "success":
        return resp["result"]
    else:
        raise ApiException("Failed to get project", resp["message"])


def get_user_data(username):
    """Returns user contact information

    : returns: user_data
    : rtype: dict
    """
    tas_client = TASClient(baseURL=settings.TAS_URL, credentials={"username": settings.TAS_CLIENT_KEY, "password": settings.TAS_CLIENT_SECRET})
    user_data = tas_client.get_user(username=username)
    return user_data


def get_per_user_allocation_usage(allocation_id):
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.get(f"{settings.TAS_URL}/v1/allocations/{allocation_id}/usage", auth=auth)
    resp = r.json()
    if resp["status"] == "success":
        return resp["result"]
    else:
        raise ApiException("Failed to get project users: {}".format(resp["message"]))


def add_user(project_id, user_id):
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    uri = f"{settings.TAS_URL}/v1/projects/{project_id}/users/{user_id}"
    r = requests.post(uri, auth=auth)
    resp = r.json()
    if resp["status"] != "success":
        raise ApiException("Failed to add user: '{}'".format(resp["message"]))
    return resp["result"]


def remove_user(project_id, user_id):
    auth = requests.auth.HTTPBasicAuth(settings.TAS_CLIENT_KEY, settings.TAS_CLIENT_SECRET)
    r = requests.delete(f"{settings.TAS_URL}/v1/projects/{project_id}/users/{user_id}", auth=auth)
    resp = r.json()
    if resp["status"] != "success":
        raise ApiException("Failed to delete user: '{}'".format(resp["message"]))
    return resp["result"]


def check_user_groups(username, groups):
    try:
        return any(user["username"] == str(username) for group in groups for user in get_project_users_from_name(group))
    except Exception as e:
        logger.error(f"Issue checking user groups for user:{username} which failed with the following exception:{e}")
        return False
