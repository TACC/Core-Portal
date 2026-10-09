import datetime
import json
import logging
import re

import networkx as nx
import requests
from django.conf import settings

from portal.apps.projects.schema_models.doi import normalize_doi
from portal.apps.projects.schema_models.keywords import normalize_keywords
from portal.apps.projects.schema_models.license_urls import (
    SPDX_SCHEME_URI,
    resolve_license_spdx_id,
    resolve_license_url,
)
from portal.apps.projects.schema_models.orcid import ORCID_URL_PREFIX, orcid_url
from portal.apps.public_data.origin import get_configured_origin
from portal.apps.publications.utils import get_landing_page_path, get_published_workspace_id

logger = logging.getLogger(__name__)

# The DataCite metadata schema every DOI's metadata is sent against: the kernel-4 family, whose
# current 4.x release DataCite applies. Stated rather than left to DataCite's default, since the
# payload uses 4.x-only fields (e.g. rightsIdentifier/rightsIdentifierScheme in `rightsList`).
DATACITE_SCHEMA_VERSION = "http://datacite.org/schema/kernel-4"


class DataCiteError(Exception):
    """DataCite rejected a request, or answered with something other than a JSON success body.

    `status_code` is the HTTP status; `errors` is DataCite's JSON:API `errors` array (each item
    typically has `status`, `title` and, for validation failures, `source`), or [] when the body
    had none.
    """

    def __init__(self, message, status_code=None, errors=None):
        super().__init__(message)
        self.status_code = status_code
        self.errors = errors or []


def _check_datacite_response(res, action):
    """Return a DataCite response's JSON body, or raise DataCiteError.

    DataCite reports failures as a non-2xx status with a JSON:API `errors` array -- e.g. a 422
    when a DOI's metadata fails schema validation, which drafts are lenient about but the
    `publish` event (draft -> findable) enforces in full. Treating that body as a success would
    let a DOI silently stay a draft. An `errors` array on a 2xx is
    treated as a failure too, as is a body that isn't JSON at all (e.g. a proxy's HTML error page).
    """

    try:
        body = res.json()
    except ValueError:
        body = None

    errors = body.get("errors") if isinstance(body, dict) else None
    if res.ok and body is not None and not errors:
        return body

    if errors and not isinstance(errors, list):
        errors = [errors]
    if errors:
        detail = "; ".join(
            (
                ": ".join(str(part) for part in (error.get("source"), error.get("title")) if part)
                if isinstance(error, dict)
                else ""
            )
            or json.dumps(error)
            for error in errors
        )
    elif body is None:
        detail = f"non-JSON response: {res.text[:200]!r}"
    else:
        detail = json.dumps(body)[:200]
    raise DataCiteError(
        f"DataCite {action} failed (HTTP {res.status_code}): {detail}",
        status_code=res.status_code,
        errors=errors,
    )


def _get_subjects(base_meta):
    """Build DataCite's `subjects` property -- a list of `{"subject": ...}`
    objects -- from the publication's `keywords`, normalized by
    projects/schema_models/keywords.py, the same function the landing page's
    schema.org `keywords` and `keywords` meta tag use (public_data/schema_org.py).
    """

    return [{"subject": keyword} for keyword in normalize_keywords(base_meta.get("keywords"))]


def _get_rights_list(base_meta, project_id):
    """Build DataCite's `rightsList` property from the publication's stored
    license selection.

    Reuses the same license mapping (projects/schema_models/license_urls.py,
    plus PORTAL_PUBLICATION_LICENSE_URLS) that public_data/schema_org.py's
    `_get_license` resolves the
    schema.org/Croissant `license` field from, so DataCite's record and this
    publication's own landing page never disagree about what its license
    resolves to. The DPMP publish wizard requires `license`
    (drpMetadataValidate), but the server doesn't enforce it, and publications
    made before it was required, or in other portals, may have none. So an
    unset license just means no `rightsList` entry here, not a fatal error
    (Croissant still requires one -- see REQUIRED_CROISSANT_FIELDS in
    public_data/schema_org.py -- so such a publication's landing page makes no
    Croissant claim). An unmapped *label* (present, but with no mapped URL)
    is a misconfiguration, but not one worth failing the DOI mint over --
    Core-Portal is shared, and another portal's form may offer labels this
    one doesn't know. So it's logged and left out, the same way the landing
    page's `license` is, rather than sent as a bare-text rights entry.
    """

    license_value = base_meta.get("license")
    if not license_value:
        return []
    license_url = resolve_license_url(license_value)
    if license_url is None:
        logger.error(
            f"Publication {project_id} has license {license_value!r}, which has no "
            "license-deed URL (projects/schema_models/license_urls.py or "
            "PORTAL_PUBLICATION_LICENSE_URLS) and isn't itself a URL, so it's left "
            f"out of DataCite's rightsList. Add a URL for {license_value!r} to "
            "PORTAL_PUBLICATION_LICENSE_URLS."
        )
        return []
    rights = {"rights": license_value, "rightsUri": license_url}
    # DataCite's recommended machine-readable license id, when the license has
    # an SPDX one (LICENSE_SPDX_IDS).
    spdx_id = resolve_license_spdx_id(license_value)
    if spdx_id:
        rights.update(
            rightsIdentifier=spdx_id,
            rightsIdentifierScheme="SPDX",
            schemeUri=SPDX_SCHEME_URI,
        )
    return [rights]


def _get_issued_date(base_meta):
    """Return the publication's "YYYY-MM-DD" issue date for DataCite's `dates`.

    publish_project writes the date into the tree before building this payload: the source project's
    stored first-publish date on a republish, or the published project's `created` on a first publish.
    update_datacite_metadata's rebuild from a stored Publication reads that same date. It's a
    datetime in memory or an ISO string once saved (DjangoJSONEncoder). Returns None for a tree with
    no usable date, rather than guessing today's: for a publication made before that date was
    stored, today would overwrite the DOI's real Issued date. `publicationYear` is taken from this
    date.
    """

    stored = base_meta.get("publicationDate") or base_meta.get("publication_date")
    if isinstance(stored, (datetime.date, datetime.datetime)):
        return stored.isoformat()[:10]
    if isinstance(stored, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", stored[:10]):
        return stored[:10]
    return None


def get_datacite_url(project_id: str, version: int | None = None):
    """Build the landing-page URL a DOI resolves to: the version's published system id under
    PORTAL_PUBLICATION_DATACITE_URL_PREFIX, when that's an absolute URL. For DPMP that's the
    landing page's own canonical URL (get_landing_page_path), and every other portal's DOIs keep
    resolving where they always have. There's no `request` here to fall back on the way the views
    do -- this runs from Celery tasks -- so otherwise the landing page's path is used on
    VANITY_BASE_URL.
    """

    prefix = settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX
    if get_configured_origin():
        workspace_id = get_published_workspace_id(project_id, version)
        return f"{prefix.rstrip('/')}/{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{workspace_id}"

    origin = settings.VANITY_BASE_URL
    if not origin:
        raise ValueError(
            "Neither PORTAL_PUBLICATION_DATACITE_URL_PREFIX (as an absolute URL) "
            "nor VANITY_BASE_URL is configured -- refusing to mint a DataCite "
            "DOI without a real landing-page URL to register it against."
        )
    # A republish's DOI points at that version's `vN` URL, the same one the
    # landing page claims as canonical (see get_landing_page_path).
    return f"{origin}{get_landing_page_path(project_id, version)}"


def get_datacite_json(pub_graph: nx.DiGraph, project_id: str, version: int | None = None):
    """
    Generate datacite payload for a publishable entity. `pub_graph` is the
    output of either `get_publication_subtree` or `get_publication_full_tree`.

    `project_id` is the publication's bare project id (e.g. "PRJ-123", matching
    Publication.project_id / public_data/urls.py's `index` route) -- it can't
    be read off `pub_graph` itself: by the time this runs during publish,
    NODE_ROOT's own `projectId` has already been rewritten to the
    fully-qualified, possibly-versioned published system id (e.g.
    "cep.project.published.PRJ-123" or "...PRJ-123v2" -- see
    project_publish_operations.py's publish_project), which is a different
    string than the bare id the `index` route's `project_id` kwarg expects.

    `version` is the same republish counter (project_publish_operations.py's
    publish_project argument, mirrored onto Publication.version) that
    public_data/schema_org.py's schema.org JSON-LD already emits as `version`
    -- optional here (defaults to None, omitted from the payload) since some
    callers/tests mint a DOI with no version context at all.
    """

    datacite_json = {}

    base_meta_node = "NODE_ROOT"

    base_meta = pub_graph.nodes[base_meta_node]["value"]

    author_attr = []

    # Whitespace-only counts as unset too, so it can't become a blank affiliation name.
    institution = (base_meta.get("institution") or "").strip() or None

    for author in base_meta.get("authors", []):
        first_name = (author.get("first_name") or "").strip()
        last_name = (author.get("last_name") or "").strip()
        # DataCite rejects a creator with an empty `name` (a 422 at publish), so a nameless author is
        # left out, matching the landing page's schema.org `creator` (public_data/schema_org.py).
        if not (first_name or last_name):
            logger.warning(f"Publication {project_id} has an author with no name; leaving them out of `creators`.")
            continue
        creator = {
            # DataCite's schema requires `name` on every creator (the other
            # name parts below are supplementary) -- "Family, Given" is
            # DataCite's own recommended form, the same convention
            # format_citation_author (public_data/citations.py) already uses
            # for Scholar's citation_author tag.
            "name": ", ".join(part for part in (last_name, first_name) if part),
            "nameType": "Personal",
        }
        # Left out when empty rather than sent as "": the name part is unknown, not blank.
        if first_name:
            creator["givenName"] = first_name
        if last_name:
            creator["familyName"] = last_name
        # Every creator is affiliated with the publication-level `institution`
        # (also the HostingInstitution contributor below); an author's own
        # `institution`, if any, is ignored. DataCite requires
        # `name` on every affiliation, and allows only strings (no null) for it
        # and for schemeUri/affiliationIdentifier/affiliationIdentifierScheme. So
        # `affiliation` is left out entirely when the publication has no
        # institution, rather than sent as [{"name": null}]. The identifier
        # fields are always left out: nothing supplies them yet.
        if institution:
            creator["affiliation"] = [{"name": institution}]

        # Normalized the same way the landing page's `sameAs` is (projects/schema_models/
        # orcid.py): a stored URL, a lowercase "x" or an unhyphenated iD all register as the
        # same canonical URL, and an invalid value is left out rather than sent to DataCite.
        author_orcid_url = orcid_url(author.get("orcid_id"))
        if author_orcid_url:
            creator["nameIdentifiers"] = [
                {
                    "nameIdentifier": author_orcid_url,
                    "nameIdentifierScheme": "ORCID",
                    "schemeUri": ORCID_URL_PREFIX.rstrip("/"),
                }
            ]

        author_attr.append(creator)

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
            # Matches the `language` field below -- an IETF BCP-47 / ISO 639-1 code.
            "lang": "en",
        }
    ]

    # `resourceType` is DataCite's free-text refinement of `resourceTypeGeneral`; with no finer
    # category to offer, DataCite's guidance is to repeat the general type.
    datacite_json["types"] = {"resourceTypeGeneral": "Dataset", "resourceType": "Dataset"}
    datacite_json["publisher"] = settings.PORTAL_PUBLICATION_PUBLISHER

    # The year comes from the Issued date, so the two (and the landing page's citeAs year) can't
    # disagree. Only a first publish sends it: upsert_datacite_json drops it from an update. With no
    # known date both are left out, so an update keeps the dates DataCite already has.
    issued_date = _get_issued_date(base_meta)
    if issued_date:
        datacite_json["publicationYear"] = int(issued_date[:4])
        datacite_json["dates"] = [{"date": issued_date, "dateType": "Issued"}]
    else:
        logger.warning(f"Publication {project_id} has no publication date; sending DataCite no Issued date.")

    datacite_json["subjects"] = _get_subjects(base_meta)
    datacite_json["rightsList"] = _get_rights_list(base_meta, project_id)
    if version is not None:
        datacite_json["version"] = str(version)

    # DataCite requires `url` to be the DOI's resolvable landing page -- once
    # minted, it's what doi.org redirects to, so a wrong value registers a
    # supposedly-permanent DOI that 404s. When PORTAL_PUBLICATION_DATACITE_URL_PREFIX
    # is an absolute URL, it's that prefix plus the version's published system
    # id (`<prefix>/<system prefix>.<project id>[vN]`), which for DPMP is the
    # landing page's canonical URL. Otherwise it's VANITY_BASE_URL plus the
    # landing page's path. See get_datacite_url.
    datacite_json["url"] = get_datacite_url(project_id, version)
    datacite_json["prefix"] = settings.PORTAL_PUBLICATION_DATACITE_SHOULDER
    # Sent on every create and update (see DATACITE_SCHEMA_VERSION).
    datacite_json["schemaVersion"] = DATACITE_SCHEMA_VERSION

    # DataCite's schema requires an IETF BCP-47 / ISO 639-1 code here
    # (e.g. "en"), not the language's English name -- matches the
    # DC.language/`@language` value already emitted elsewhere for this same
    # publication (public_data/schema_org.py, base.html).
    datacite_json["language"] = "en"

    datacite_json["identifiers"] = [
        {
            "identifierType": "Project ID",
            "identifier": base_meta["projectId"],
        }
    ]

    # DataCite rejects an empty relatedIdentifier with a 422 at the publish event, so an entry
    # whose link is blank is skipped rather than sent.
    datacite_json["relatedIdentifiers"] = []
    for r_data in base_meta.get("relatedDatasets", []):
        link = (r_data.get("datasetLink") or "").strip()
        if {"datasetTitle", "datasetDescription"} <= r_data.keys() and link:
            datacite_json["relatedIdentifiers"].append(
                {"relationType": "References", "relatedIdentifier": link, "relatedIdentifierType": "URL"}
            )

    for r_data in base_meta.get("relatedSoftware", []):
        link = (r_data.get("softwareLink") or "").strip()
        if {"softwareTitle", "softwareDescription"} <= r_data.keys() and link:
            datacite_json["relatedIdentifiers"].append(
                {"relationType": "References", "relatedIdentifier": link, "relatedIdentifierType": "URL"}
            )

    relation_mapping = {
        "linked_dataset": "IsPartOf",
        "cited_by": "IsCitedBy",
        "context": "IsDocumentedBy",
    }

    for r_data in base_meta.get("relatedPublications", []):
        identifier = {"relationType": relation_mapping.get(r_data.get("publicationType"), "References")}
        # Normalized to a bare DOI (projects/schema_models/doi.py), the form DataCite expects for
        # relatedIdentifierType "DOI". An empty value, or one that isn't a DOI, falls back to the link;
        # an entry with neither is skipped.
        related_doi = normalize_doi(r_data.get("publicationDoi"))
        link = (r_data.get("publicationLink") or "").strip()
        if related_doi:
            identifier.update(relatedIdentifier=related_doi, relatedIdentifierType="DOI")
        elif link:
            identifier.update(relatedIdentifier=link, relatedIdentifierType="URL")
        else:
            continue
        datacite_json["relatedIdentifiers"].append(identifier)

    return datacite_json


# Relation types get_datacite_json sends. Any other relation already registered on a DOI (e.g. a
# pre-portal DOI's IsReferencedBy) is something the portal can't express, so updates keep it.
_PORTAL_RELATION_TYPES = frozenset({"References", "IsPartOf", "IsCitedBy", "IsDocumentedBy"})


def get_registered_doi_attributes(doi: str) -> dict:
    """The metadata DataCite currently holds for `doi`, as its JSON:API `attributes`. Raises
    DataCiteError if DataCite doesn't return it. Authenticated, so a draft DOI is readable too.
    """

    res = requests.get(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        # Affiliations as objects, the form they're sent in, rather than DataCite's default strings.
        params={"affiliation": "true"},
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        timeout=30,
    )
    return _check_datacite_response(res, f"read of {doi}")["data"]["attributes"]


def _creator_key(creator):
    return " ".join((creator.get("name") or "").casefold().split())


# Registered entries the metadata schema rejects, which some pre-portal DOIs carry (e.g. a
# contributor with no contributorType, or an empty relatedIdentifier). Sending one back would get the
# whole update a 422, so they're dropped instead.
_INVALID_REGISTERED_ENTRY = {
    "contributors": lambda contributor: (
        not (contributor.get("contributorType") and (contributor.get("name") or "").strip())
    ),
    "relatedIdentifiers": lambda related: (
        not (
            (related.get("relatedIdentifier") or "").strip()
            and related.get("relatedIdentifierType")
            and related.get("relationType")
        )
    ),
}


def merge_registered_metadata(metadata: dict, registered: dict) -> dict:
    """`metadata` (a get_datacite_json payload for a DOI that already exists) merged with what
    DataCite already holds for that DOI, so an update can't erase metadata the portal doesn't
    collect. DataCite replaces every list attribute sent wholesale, and DOIs registered before the
    portal (or edited at DataCite) carry metadata no publication tree has.

    The portal's values win for what it collects. Registered values are kept where the portal has
    nothing of that kind: lists the publication leaves empty aren't sent at all, and registered
    entries of a kind the portal never produces (subjects with a scheme, non-Abstract descriptions,
    typed titles, contributor/date/relation types it doesn't send) are kept alongside its own. A
    registered Issued date is kept too: it's the DOI's original issue date, which publicationYear
    (never sent on an update) matches. A creator with the same name keeps its registered ORCID when
    the portal has none, and its registered affiliation unless that's just the hosting institution
    the portal gave every author. Registered entries the schema rejects (_INVALID_REGISTERED_ENTRY)
    are dropped, and a list that had one is always sent, so DataCite's copy is cleaned too.
    """

    merged = dict(metadata)
    registered = dict(registered)
    invalid_fields = set()
    for field, is_invalid in _INVALID_REGISTERED_ENTRY.items():
        entries = registered.get(field) or []
        valid = [entry for entry in entries if not is_invalid(entry)]
        if len(valid) < len(entries):
            logger.warning(f"Dropping {len(entries) - len(valid)} invalid registered {field} entries from the update.")
            invalid_fields.add(field)
            registered[field] = valid

    def keep(field, kept):
        if merged.get(field):
            merged[field] = merged[field] + [entry for entry in registered.get(field) or [] if kept(entry)]
        elif field in invalid_fields:
            merged[field] = registered[field]
        else:
            merged.pop(field, None)

    keep("subjects", lambda subject: subject.get("subjectScheme"))
    keep("relatedIdentifiers", lambda related: related.get("relationType") not in _PORTAL_RELATION_TYPES)
    if not merged.get("rightsList"):
        merged.pop("rightsList", None)

    sent_contributor_types = {contributor.get("contributorType") for contributor in merged.get("contributors", [])}
    merged["contributors"] = merged.get("contributors", []) + [
        contributor
        for contributor in registered.get("contributors") or []
        if contributor.get("contributorType") not in sent_contributor_types
    ]
    registered_dates = registered.get("dates") or []
    keeps_issued = any(date.get("dateType") == "Issued" and date.get("date") for date in registered_dates)
    dates = [date for date in merged.get("dates", []) if not (keeps_issued and date.get("dateType") == "Issued")]
    sent_date_types = {date.get("dateType") for date in dates}
    merged["dates"] = dates + [date for date in registered_dates if date.get("dateType") not in sent_date_types]
    merged["descriptions"] = merged.get("descriptions", []) + [
        description
        for description in registered.get("descriptions") or []
        if description.get("descriptionType") != "Abstract"
    ]
    merged["titles"] = merged.get("titles", []) + [
        title for title in registered.get("titles") or [] if title.get("titleType")
    ]
    for field in ("contributors", "dates", "descriptions", "titles"):
        if not merged[field] and field not in invalid_fields:
            del merged[field]

    portal_affiliations = [
        [{"name": contributor.get("name")}]
        for contributor in registered.get("contributors") or []
        if contributor.get("contributorType") == "HostingInstitution"
    ]
    registered_creators = {_creator_key(creator): creator for creator in registered.get("creators") or []}
    creators = []
    for creator in merged.get("creators", []):
        match = registered_creators.get(_creator_key(creator))
        if match:
            creator = dict(creator)
            if match.get("nameIdentifiers") and not creator.get("nameIdentifiers"):
                creator["nameIdentifiers"] = match["nameIdentifiers"]
            affiliation = [{"name": entry.get("name")} for entry in match.get("affiliation") or []]
            if affiliation and affiliation not in portal_affiliations:
                creator["affiliation"] = match["affiliation"]
        creators.append(creator)
    if "creators" in merged:
        merged["creators"] = creators
    return merged


def upsert_datacite_json(datacite_json: dict, doi: str | None = None):
    """
    Create a draft DOI in datacite with the specified metadata. If a DOI is
    specified, the metadata for that DOI is updated instead, merged with what
    DataCite already holds for it (merge_registered_metadata). Raises
    DataCiteError if DataCite rejects the request.
    """
    if doi:
        datacite_json.pop("publicationYear", None)
        datacite_json = merge_registered_metadata(datacite_json, get_registered_doi_attributes(doi))

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

    return _check_datacite_response(res, f"update of {doi}" if doi else "DOI creation")


def publish_datacite_doi(doi: str, url: str | None = None, metadata: dict | None = None):
    """
    Set a DOI's status to `Findable` in Datacite, and its URL to `url` when
    given. `metadata` (a get_datacite_json payload) is sent in the same request,
    so a republish's new metadata and URL reach DataCite together. As with any
    update, its publicationYear is left out, and it's merged with what DataCite
    already holds (merge_registered_metadata). Raises DataCiteError if DataCite
    rejects it (e.g. metadata that fails full schema validation).
    """
    if metadata:
        metadata = merge_registered_metadata(metadata, get_registered_doi_attributes(doi))
    attributes = {**(metadata or {}), "event": "publish"}
    attributes.pop("publicationYear", None)
    if url:
        attributes["url"] = url
    payload = {"data": {"type": "dois", "attributes": attributes}}

    res = requests.put(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        data=json.dumps(payload),
        headers={"Content-Type": "application/vnd.api+json"},
        timeout=30,
    )
    return _check_datacite_response(res, f"publish of {doi}")


def hide_datacite_doi(doi: str):
    """
    Remove a Datacite DOI from public consumption. Raises DataCiteError if
    DataCite rejects it.
    """
    payload = {"data": {"type": "dois", "attributes": {"event": "hide"}}}

    res = requests.put(
        f"{settings.DATACITE_URL.strip('/')}/dois/{doi}",
        auth=(settings.DATACITE_USER, settings.DATACITE_PASS),
        data=json.dumps(payload),
        headers={"Content-Type": "application/vnd.api+json"},
        timeout=30,
    )
    return _check_datacite_response(res, f"hide of {doi}")


def get_doi_publication_date(doi: str) -> str:
    """Look up the publication date for a DOI"""
    res = requests.get(f"{settings.DATACITE_URL.strip('/')}/dois/{doi}", timeout=30)
    res.raise_for_status()
    return res.json()["data"]["attributes"]["created"]
