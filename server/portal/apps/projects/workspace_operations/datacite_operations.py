import datetime
from typing import Optional
import json
import requests
import networkx as nx
from django.conf import settings


def get_datacite_json(pub_graph: nx.DiGraph):
    """
    Generate datacite payload for a publishable entity. `pub_graph` is the output of
    either `get_publication_subtree` or `get_publication_full_tree`.
    """

    datacite_json = {}

    base_meta_node = "NODE_ROOT"

    base_meta = pub_graph.nodes[base_meta_node]["value"]

    author_attr = []
    institutions = []
    for author in base_meta.get("authors", []):
        author_attr.append(
            {
                "nameType": "Personal",
                "givenName": author.get("first_name", ""),
                "familyName": author.get("last_name", ""),
            }
        )
        institutions.append(author.get("inst", ""))

    datacite_json["contributors"] = [
        {
            "contributorType": "HostingInstitution",
            "nameType": "Organizational",
            "name": institution,
        }
        for institution in list(set(institutions))
    ]
    datacite_json["creators"] = author_attr
    datacite_json["titles"] = [{"title": base_meta["title"]}]

    datacite_json["publisher"] = "Digital Porous Media"

    datacite_json["publicationYear"] = datetime.datetime.now().year

    project_id = base_meta["projectId"]
    datacite_url = f"{settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX}/{project_id}"

    datacite_json["url"] = datacite_url
    datacite_json["prefix"] = settings.PORTAL_PUBLICATION_DATACITE_SHOULDER

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
            identifier["relationType"] = relation_mapping.get(
                publication_type, "References"
            )
            identifier["relatedIdentifier"] = r_data["publicationLink"]
            identifier["relatedIdentifierType"] = "URL"
            if "publicationDoi" in r_data:
                identifier["relatedIdentifier"] = r_data["publicationDoi"]
                identifier["relatedIdentifierType"] = "DOI"
            datacite_json["relatedIdentifiers"].append(identifier)

    return datacite_json


def upsert_datacite_json(datacite_json: dict, doi: Optional[str] = None):
    """
    Create a draft DOI in datacite with the specified metadata. If a DOI is specified,
    the metadata for that DOI is updated instead.
    """
    if doi:
        datacite_json.pop("publicationYear", None)

    datacite_payload = {
        "data": {
            "type": "dois",
            "relationships": {
                "client": {"data": {"type": "clients", "id": "tdl.tacc"}}
            },
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
