from django.db.models import Q
from django.conf import settings
from pytas.http import TASClient
import logging

logger = logging.getLogger(__name__)

def list_to_model_queries(q_comps):
    query = None
    if len(q_comps) > 2:
        query = Q(first_name__icontains = ' '.join(q_comps[:1]))
        query |= Q(first_name__icontains = ' '.join(q_comps[:2]))
        query |= Q(last_name__icontains = ' '.join(q_comps[1:]))
        query |= Q(last_name__icontains = ' '.join(q_comps[2:]))
    else:
        query = Q(first_name__icontains = q_comps[0])
        query |= Q(last_name__icontains = q_comps[1])
    return query

def q_to_model_queries(q):
    if not q:
        return None

    query = None
    if ' ' in q:
        q_comps = q.split()
        query = list_to_model_queries(q_comps)
    else:
        query = Q(email__icontains = q)
        query |= Q(first_name__icontains = q)
        query |= Q(last_name__icontains = q)

    return query

def get_allocations(username):
    """Returns active user allocations on TACC resources

    *allocations * is a dict, with keys corresponding to TACC system hostnames, and values
    being the allocation project ids the user has on that system.

    e.g. allocations = {'stampede2': [
        'TACC-ACI', 'PT2050-DataX', 'NeuroNex-3DEM', 'DesignSafe-Community']}

    : returns: allocations
    : rtype: dict
    """

    # A dict for translating TAS allocation resources to hostnames
    hosts = {
        'Stampede4': 'stampede2.tacc.utexas.edu',
        'Corral2': 'data.tacc.utexas.edu',
        'Lonestar5': 'ls5.tacc.utexas.edu',
        'Maverick2': 'maverick.tacc.utexas.edu',
        'Maverick3': 'maverick2.tacc.utexas.edu',
        'Rodeo2': 'rodeo.tacc.utexas.edu',
        'Wrangler': 'wrangler.tacc.utexas.edu',
        'Wrangler2': 'wrangler.tacc.utexas.edu',
        'Wrangler3': 'wrangler.tacc.utexas.edu',
    }

    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            'username': settings.TAS_CLIENT_KEY,
            'password': settings.TAS_CLIENT_SECRET
        }
    )

    projects = tas_client.projects_for_user(username=username)
    allocations = {}

    for proj in projects:
        for alloc in proj['allocations']:
            if alloc['status'] == 'Active' and alloc['resource'] in hosts:
                resource = hosts[alloc['resource']]
                if resource in allocations:
                    allocations[resource].append(alloc['project'])
                else:
                    allocations[resource] = [alloc['project']]

    return allocations