import json
from django.conf import settings
from celery import shared_task
from pytas.http import TASClient
from portal.libs.elasticsearch.docs.base import IndexedAllocation
from portal.libs.elasticsearch.utils import get_sha256_hash


@shared_task(bind=True, max_retries=3, queue="api")
def index_allocations(self, username):
    """Pulls user allocations from TAS and indexes them in Elasticsearch"""
    allocations = get_tas_allocations(username)
    doc = IndexedAllocation(username=username, value=allocations)
    doc.meta.id = get_sha256_hash(username)
    doc.save()


def get_tas_client():
    """Return a TAS Client with pytas"""
    return TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            "username": settings.TAS_CLIENT_KEY,
            "password": settings.TAS_CLIENT_SECRET,
        },
    )


def get_tas_allocations(username):
    """Returns user allocations on TACC resources

    : returns: allocations
    : rtype: dict
    """

    tas_client = TASClient(
        baseURL=settings.TAS_URL,
        credentials={
            "username": settings.TAS_CLIENT_KEY,
            "password": settings.TAS_CLIENT_SECRET,
        },
    )
    tas_projects = tas_client.projects_for_user(username)

    with open("portal/apps/users/tas_to_tacc_resources.json") as f:
        tas_to_tacc_resources = json.load(f)

    hosts = {}
    active_allocations = {}
    inactive_allocations = {}

    for tas_proj in tas_projects:
        # Each project from tas has an array of length 1 for its allocations
        alloc = tas_proj["allocations"][0]
        charge_code = tas_proj["chargeCode"]
        if alloc["resource"] in tas_to_tacc_resources:
            resource = dict(tas_to_tacc_resources[alloc["resource"]])
            resource["allocation"] = dict(alloc)

            # Separate active and inactive allocations and make single entry for each project
            if resource["allocation"]["status"] == "Active":
                if (
                    resource["host"] in hosts
                    and charge_code not in hosts[resource["host"]]
                ):
                    hosts[resource["host"]].append(charge_code)
                elif resource["host"] not in hosts:
                    hosts[resource["host"]] = [charge_code]
                # Add allocations to the project listing if it exists
                if charge_code in active_allocations:
                    active_allocations[charge_code]["systems"].append(resource)
                # Begin the entry for each project here
                else:
                    active_allocations[charge_code] = {
                        "title": tas_proj["title"],
                        "projectId": tas_proj["id"],
                        "pi": "{} {}".format(
                            tas_proj["pi"]["firstName"], tas_proj["pi"]["lastName"]
                        ),
                        "projectName": tas_proj["chargeCode"],
                        "systems": [resource],
                    }
            else:
                if charge_code in inactive_allocations:
                    inactive_allocations[charge_code]["systems"].append(resource)
                else:
                    inactive_allocations[charge_code] = {
                        "title": tas_proj["title"],
                        "projectId": tas_proj["id"],
                        "pi": "{} {}".format(
                            tas_proj["pi"]["firstName"], tas_proj["pi"]["lastName"]
                        ),
                        "projectName": tas_proj["chargeCode"],
                        "systems": [resource],
                    }
    return {
        "hosts": hosts,
        "portal_alloc": settings.PORTAL_ALLOCATION,
        "active": list(active_allocations.values()),
        "inactive": list(inactive_allocations.values()),
    }
