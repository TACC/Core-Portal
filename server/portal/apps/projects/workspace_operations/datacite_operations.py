import datetime
import json

import networkx as nx
import requests
from django.conf import settings
from django.urls import reverse


def get_datacite_json(pub_graph: nx.DiGraph, project_id: str):
    """
    Generate datacite payload for a publishable entity. `pub_graph` is the output of
    either `get_publication_subtree` or `get_publication_full_tree`.

    `project_id` is the publication's bare project id (e.g. "PRJ-123", matching
    Publication.project_id / public_data/urls.py's `index` route) -- it can't be read off
    `pub_graph` itself: by the time this runs during publish, NODE_ROOT's own `projectId` has
    already been rewritten to the fully-qualified, possibly-versioned published system id (e.g.
    "cep.project.published.PRJ-123" or "...PRJ-123v2" -- see project_publish_operations.py's
    publish_project), which is a different string than the bare id the `index` route's
    `project_id` kwarg expects.
    """

    datacite_json = {}

    base_meta_node = "NODE_ROOT"

    base_meta = pub_graph.nodes[base_meta_node]["value"]

    author_attr = []
    institutions = []

    institution = base_meta.get("institution")

    for author in base_meta.get("authors", []):
        author_attr.append(
            {
                "nameType": "Personal",
                "givenName": author.get("first_name", ""),
                "familyName": author.get("last_name", ""),
                "affiliation": [
                    {
                        "name": institution,
                        "schemeUri": None,
                        "affiliationIdentifier": None,
                        "affiliationIdentifierScheme": None,
                    }
                ],
            }
        )
        institutions.append(author.get("inst", ""))

    if institution:
        datacite_json["contributors"] = [
            {
                "contributorType": "HostingInstitution",
                "nameType": "Organizational",
                "name": institution,
            }
        ]
    datacite_json["creators"] = author_attr
    datacite_json["titles"] = [{"title": base_meta["title"]}]

    datacite_json["descriptions"] = [
        {
            "descriptionType": "Abstract",
            "description": base_meta["description"],
            "lang": "en-Us",
        }
    ]

    datacite_json["types"] = {}
    datacite_json["types"]["resourceTypeGeneral"] = "Dataset"
    datacite_json["publisher"] = settings.PORTAL_PUBLICATION_PUBLISHER

    datacite_json["publicationYear"] = datetime.datetime.now().year

    # DataCite requires `url` to be the DOI's actual resolvable landing page -- once minted,
    # this is what doi.org redirects to, so getting it wrong isn't a cosmetic SEO problem the
    # way public_data/views.py's landing-page URL used to be (see _get_landing_page_url's
    # docstring): it silently registers a supposedly-permanent DOI that 404s. Built the same way
    # _get_landing_page_url now is -- reversing public_data/urls.py's own `index` route, rather
    # than hand-concatenating PORTAL_PUBLICATION_DATACITE_URL_PREFIX, which doesn't reliably
    # point at that route. There's no `request` available here to fall back an origin against
    # the way _get_configured_origin does -- this runs from a Celery task (publish_project), not
    # a view -- so the origin comes from VANITY_BASE_URL instead, the same request-independent
    # absolute-URL setting webhooks/utils.py already uses for the same reason.
    if not settings.VANITY_BASE_URL:
        raise ValueError(
            "VANITY_BASE_URL is not configured -- refusing to mint a DataCite DOI without a "
            "real landing-page URL to register it against."
        )
    landing_page_path = reverse("publications:index", kwargs={"project_id": project_id})
    datacite_json["url"] = f"{settings.VANITY_BASE_URL}{landing_page_path}"
    datacite_json["prefix"] = settings.PORTAL_PUBLICATION_DATACITE_SHOULDER

    datacite_json["language"] = "English"

    datacite_json["identifiers"] = [
        {
            "identifierType": "Project ID",
            "identifier": base_meta["projectId"],
        }
    ]

    datacite_json["relatedIdentifiers"] = []
    for r_data in base_meta.get("relatedDatasets", []):
        identifier = {}
        if {"datasetTitle", "datasetDescription", "datasetLink"} <= r_data.keys():
            identifier["relationType"] = "References"
            identifier["relatedIdentifier"] = r_data["datasetLink"]
            identifier["relatedIdentifierType"] = "URL"
            datacite_json["relatedIdentifiers"].append(identifier)

    for r_data in base_meta.get("relatedSoftware", []):
        identifier = {}
        if {"softwareTitle", "softwareDescription", "softwareLink"} <= r_data.keys():
            identifier["relationType"] = "References"
            identifier["relatedIdentifier"] = r_data["softwareLink"]
            identifier["relatedIdentifierType"] = "URL"
            datacite_json["relatedIdentifiers"].append(identifier)

    relation_mapping = {
        "linked_dataset": "IsPartOf",
        "cited_by": "IsCitedBy",
        "context": "IsDocumentedBy",
    }

    for r_data in base_meta.get("relatedPublications", []):
        identifier = {}
        if {"publicationLink"} <= r_data.keys():
            publication_type = r_data.get("publicationType", None)
            identifier["relationType"] = relation_mapping.get(publication_type, "References")
            identifier["relatedIdentifier"] = r_data["publicationLink"]
            identifier["relatedIdentifierType"] = "URL"
            if "publicationDoi" in r_data:
                identifier["relatedIdentifier"] = r_data["publicationDoi"]
                identifier["relatedIdentifierType"] = "DOI"
            datacite_json["relatedIdentifiers"].append(identifier)

    return datacite_json


def upsert_datacite_json(datacite_json: dict, doi: str | None = None):
    """
    Create a draft DOI in datacite with the specified metadata. If a DOI is specified,
    the metadata for that DOI is updated instead.
    """
    if doi:
        datacite_json.pop("publicationYear", None)

    datacite_payload = {
        "data": {
            "type": "dois",
            "relationships": {"client": {"data": {"type": "clients", "id": settings.DATACITE_USER}}},
            "attributes": datacite_json,
        }
    }
    if not doi:
        res = requests.post(
            f"{settings.DATACITE_URL.strip('/')}/dois",
            auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
            data=json.dumps(datacite_payload),
            headers={"Content-Type": "application/vnd.api+json"},
            timeout=30,
        )
    else:
        res = requests.put(
            f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
            auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
            data=json.dumps(datacite_payload),
            headers={"Content-Type": "application/vnd.api+json"},
            timeout=30,
        )

    return res.json()


def publish_datacite_doi(doi: str):
    """
    Set a DOI's status to `Findable` in Datacite.
    """
    payload = {"data": {"type": "dois", "attributes": {"event": "publish"}}}

    res = requests.put(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        data=json.dumps(payload),
        headers={"Content-Type": "application/vnd.api+json"},
        timeout=30,
    )
    return res.json()


def hide_datacite_doi(doi: str):
    """
    Remove a Datacite DOI from public consumption.
    """
    payload = {"data": {"type": "dois", "attributes": {"event": "hide"}}}

    res = requests.put(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        data=json.dumps(payload),
        headers={"Content-Type": "application/vnd.api+json"},
        timeout=30,
    )
    return res.json()


def get_doi_publication_date(doi: str) -> str:
    """Look up the publication date for a DOI"""
    res = requests.get(f"{settings.DATACITE_URL.strip('/')}/dois/{doi}", timeout=30)
    res.raise_for_status()
    return res.json()["data"]["attributes"]["created"]
