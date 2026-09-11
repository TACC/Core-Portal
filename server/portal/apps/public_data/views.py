import json
import logging
import mimetypes
import re
from urllib.parse import quote

import networkx as nx
from django.conf import settings
from django.http import HttpResponse, Http404
from django.views.generic.base import TemplateView, View

from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json
from portal.apps.publications.models import Publication

logger = logging.getLogger(__name__)

# Properties every schema.org/Dataset must have for Google Dataset Search to consider the page
# eligible for a dataset rich result, Croissant conformance aside. If either ends up
# missing/empty for a publication, get_schema_org_json raises rather than silently emitting a
# Dataset that fails Google's own baseline requirements.
REQUIRED_DATASET_FIELDS = ("name", "description")

# Properties Croissant (http://mlcommons.org/croissant/1.0) additionally requires on a
# conformant Dataset, on top of REQUIRED_DATASET_FIELDS above. If any of these end up
# missing/empty for a publication, that publication cannot honestly claim `conformsTo` and
# get_schema_org_json raises rather than silently dropping the field.
# `url`/`identifier` are also hard-required, but checked separately in get_schema_org_json --
# see the comment there -- since their PORTAL_PUBLICATION_DATACITE_URL_PREFIX-driven fallback
# means they're never actually empty/missing from the built dict the way these fields are.
REQUIRED_CROISSANT_FIELDS = ("license", "creator", "datePublished", "distribution")

# The publication form's "license" field (settings_forms.py / dpmp.settings_forms.py) is a
# fixed `select`, not free text, so its stored value should always be one of these known
# labels. schema.org/Croissant expect `license` to be a URL (or CreativeWork), not a bare
# label, so map known labels to their canonical license-deed URL. A label with no entry here
# is treated as a misconfiguration by _get_license below -- see its docstring -- rather than
# silently passed through as non-conformant bare text.
LICENSE_URLS = {
    "ODC-BY 1.0": "https://opendatacommons.org/licenses/by/1-0/",
}

# Same characters, same \uXXXX escaping Django's own `json_script` filter applies -- valid
# anywhere inside a JSON string literal, so it can't corrupt the JSON, but it neutralizes the
# "</script>" (or "<", ">", "&" more generally) that publication title/description text could
# otherwise contain to break out of the <script type="application/ld+json"> tag it's embedded
# in (index.html renders this value with the `|safe` filter, so nothing else escapes it).
_JSON_LD_HTML_ESCAPES = {
    ord("<"): "\\u003c",
    ord(">"): "\\u003e",
    ord("&"): "\\u0026",
}

# Matches the standard ORCID iD checksum format -- 16 digits in four hyphenated groups, the
# last character optionally "X" -- e.g. the canonical example "0000-0002-1825-0097".
_ORCID_ID_RE = re.compile(r"\d{4}-\d{4}-\d{4}-\d{3}[\dX]")


def _get_license(base_meta, project_id):
    """Resolve the publication's stored license selection to its canonical license-deed URL.

    schema.org/Croissant require `license` to be a URL (or CreativeWork), not a bare label.
    A stored value that's already a URL is passed through as-is; otherwise it must have an
    entry in LICENSE_URLS. Silently falling back to the raw label for an unmapped value would
    ship a non-conformant `license` and regress silently every time a new option is added to
    the form's `select` without a matching LICENSE_URLS entry -- so this raises instead, the
    same way every other required-but-malformed field here does.
    """

    license_value = base_meta.get("license")
    if not license_value:
        return license_value
    if license_value.startswith("http://") or license_value.startswith("https://"):
        return license_value
    resolved = LICENSE_URLS.get(license_value)
    if resolved is None:
        raise SchemaOrgValidationError(
            f"Publication {project_id} has license {license_value!r}, which has no entry in "
            "LICENSE_URLS (portal/apps/public_data/views.py) and isn't itself a URL. "
            "schema.org/Croissant require `license` to be a URL, not free text -- add a "
            f"canonical license-deed URL for {license_value!r} to LICENSE_URLS."
        )
    return resolved


def _get_orcid_same_as(author):
    """Resolve an author's ORCID iD (however it's stored on the author dict) to its canonical
    https://orcid.org/ profile URL, for that creator's `sameAs` -- or None if the author has no
    (validly formed) ORCID.

    No author record actually carries an ORCID anywhere in this codebase today -- the
    author-entry form (DataFilesPublicationAuthorsModal.jsx) only collects first_name/
    last_name/email, and neither the backend author schema (base_metadata.py) nor the DataCite
    export (datacite_operations.py) has an ORCID field either. So this is forward-compatible:
    a no-op until an `orcid` key shows up on an author dict, at which point `sameAs` starts
    getting populated with no other change needed here. Unlike `license` (a REQUIRED_CROISSANT_
    FIELDS entry), a malformed ORCID isn't worth failing the whole page's JSON-LD over -- it's
    just dropped, the same way _format_citation_date degrades rather than raises.
    """

    orcid = (author.get("orcid") or "").strip()
    if not orcid:
        return None
    if orcid.startswith("http://") or orcid.startswith("https://"):
        return orcid
    if _ORCID_ID_RE.fullmatch(orcid):
        return f"https://orcid.org/{orcid}"
    return None


def _get_distribution(base_meta, project_id, request):
    """Build the Croissant/schema.org `distribution` list (one cr:FileObject per published file) from the publication's file_objs, pointing at the existing public, unauthenticated Tapis download route for the published project system.
    """

    published_system_id = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{project_id}"

    distribution = []
    for file_obj in base_meta.get("fileObjs", []):
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue

        content_url = request.build_absolute_uri(
            f"/api/datafiles/tapis/download/projects/{published_system_id}/{quote(path)}/"
        )
        file_object = {
            "@type": "cr:FileObject",
            "@id": path,
            "name": name,
            "contentUrl": content_url,
        }

        # Croissant requires encodingFormat on every FileObject -- fall back to the generic
        # "unknown binary" MIME type rather than omitting the field when the name's extension
        # isn't recognized, so this never silently drops a required property.
        encoding_format, _ = mimetypes.guess_type(name)
        file_object["encodingFormat"] = encoding_format or "application/octet-stream"
        if file_obj.get("length") is not None:
            file_object["contentSize"] = f"{file_obj['length']} B"
        # Only present once a publish-time hashing step populates it (see FileObj.sha256) --
        # computing it here would mean downloading every file on every page request.
        if file_obj.get("sha256"):
            file_object["sha256"] = file_obj["sha256"]

        distribution.append(file_object)

    return distribution


def _get_record_sets(base_meta):
    """Build the Croissant `recordSet` list (one cr:RecordSet per tabular file that has known columns) from the publication's file_objs. This only ever reads metadata already stored on `fileObjs` (the `columns` field, populated at publish time for recognized tabular formats) -- it does no file I/O of its own, since this runs on every page request. Files with no known columns are simply skipped, so a publication with no extracted schemas yet degrades to no `recordSet` at all rather than a broken one.
    """

    record_sets = []
    for file_obj in base_meta.get("fileObjs", []):
        columns = file_obj.get("columns")
        path = (file_obj.get("path") or "").lstrip("/")
        if not columns or not path:
            continue

        record_sets.append(
            {
                "@type": "cr:RecordSet",
                "@id": f"{path}/records",
                "name": file_obj.get("name"),
                "field": [
                    {
                        "@type": "cr:Field",
                        "@id": f"{path}/{column['name']}",
                        "name": column["name"],
                        "dataType": column.get("dataType", "sc:Text"),
                        "source": {
                            # Links back to the matching entry this same publication's
                            # `distribution` emits in _get_distribution, whose "@id" is
                            # also the file's stripped path.
                            "fileObject": {"@id": path},
                            "extract": {"column": column["name"]},
                        },
                    }
                    for column in columns
                    if column.get("name")
                ],
            }
        )

    return record_sets


def _get_landing_page_url(project_id, request):
    """Build the publication's landing-page URL, guaranteed absolute.

    `PORTAL_PUBLICATION_DATACITE_URL_PREFIX` defaults to None when unset (settings.py) and is
    "" in at least one deployment's settings file -- either would otherwise produce a broken
    value here ("None/<project_id>" or a bare "/<project_id>") instead of the absolute URI
    schema.org/Croissant require for `url`. `request.build_absolute_uri` leaves an
    already-absolute configured prefix untouched, and only resolves a blank one against the
    current request's scheme/host, so a misconfigured setting degrades to a valid (if not
    fully meaningful) absolute URL instead of an outright invalid relative one.
    """

    url_prefix = settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX or ""
    return request.build_absolute_uri(f"{url_prefix}/{project_id}")


def _get_cite_as(base_meta, doi, project_id, request):
    """Build a plain-text citation for the Croissant `citeAs` property, following DataCite's recommended citation format (Creator(s) (PublicationYear). Title. Publisher. Identifier), from metadata already available on the publication so it can't go stale like a hand-written  placeholder would.
    """

    authors = base_meta.get("authors", [])
    author_names = "; ".join(
        f"{author.get('first_name', '')} {author.get('last_name', '')}".strip()
        for author in authors
        if author.get("last_name")
    )

    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    year = publication_date[:4] if publication_date else ""

    identifier = f"https://doi.org/{doi}" if doi else _get_landing_page_url(project_id, request)

    parts = [
        author_names,
        f"({year})" if year else None,
        base_meta.get("title"),
        settings.PORTAL_PUBLICATION_PUBLISHER,
        identifier,
    ]
    return ". ".join(part for part in parts if part)


def _format_citation_author(author):
    """Format one author as "Last, First" -- the order Google Scholar's indexing guide asks
    citation_author tags to use (https://scholar.google.com/intl/en/scholar/inclusion.html#indexing).
    Falls back to whichever name part is present if the other is missing, and to "" (filtered
    out by the caller) if neither is.
    """

    last_name = (author.get("last_name") or "").strip()
    first_name = (author.get("first_name") or "").strip()
    if last_name and first_name:
        return f"{last_name}, {first_name}"
    return last_name or first_name


def _format_citation_date(date_value):
    """Reformat a stored ISO-ish date ("YYYY-MM-DD", optionally with a time component) into
    the slash-separated "YYYY/MM/DD" form (or "YYYY/MM"/"YYYY" for a partial date) that Google
    Scholar's citation_publication_date expects. A value that isn't recognizably ISO-formatted
    is passed through unchanged rather than dropped -- a wrong-shaped date is still more useful
    to Scholar than a missing one.
    """

    if not date_value:
        return None
    date_part = date_value[:10]
    if re.fullmatch(r"\d{4}(-\d{2}(-\d{2})?)?", date_part):
        return date_part.replace("-", "/")
    return date_value


def _get_citation_pdf_url(distribution):
    """Pick the first PDF out of an already-built Croissant `distribution` list, for Google
    Scholar's citation_pdf_url. Scholar only indexes a citation_pdf_url that's a direct,
    unauthenticated link straight to a PDF -- exactly what `distribution`'s Tapis download URLs
    already are -- so this filters the existing list instead of rebuilding one.
    """

    for file_object in distribution or []:
        if file_object.get("encodingFormat") == "application/pdf":
            return file_object.get("contentUrl")
    return None


def get_schema_org_json(pub, project_id, request):
    """Build a schema.org/Dataset JSON-LD object for a published project to embed directly in the page's <script type="application/ld+json"> tag for Google Dataset Search.
    """

    base_meta = pub.value
    doi = base_meta.get("doi")

    # A metadata-only / externally-hosted publication can legitimately have no files at all --
    # that's different from having files that failed to make it into `distribution` (missing
    # name/path on every fileObj), which is still a data bug. Only the latter should raise.
    has_files = any(file_obj.get("type") == "file" for file_obj in base_meta.get("fileObjs", []))

    creators = []
    for author in base_meta.get("authors", []):
        name = f"{author.get('first_name', '')} {author.get('last_name', '')}".strip()
        creator = {"@type": "Person", "name": name}
        if base_meta.get("institution"):
            creator["affiliation"] = {"@type": "Organization", "name": base_meta["institution"]}
        same_as = _get_orcid_same_as(author)
        if same_as:
            creator["sameAs"] = same_as
        creators.append(creator)

    schema_org_json = {
        "@context": {
            "@language": "en",
            "@vocab": "https://schema.org/",
            # Verbatim (minus unused terms) from the Croissant spec's own recommended
            # @context (Appendix 1). Every Croissant-specific key we emit anywhere in this
            # document -- in `distribution` (cr:FileObject) or `recordSet` (cr:RecordSet,
            # field/source/extract/fileObject/dataType/column) -- needs an explicit mapping
            # here, or it silently falls back to the bare @vocab and resolves to a
            # nonexistent "https://schema.org/<term>" instead of its real Croissant IRI. A
            # strict Croissant validator (e.g. MLCommons' mlcroissant) would not recognize
            # this record as Croissant without these.
            "cr": "http://mlcommons.org/croissant/",
            "dct": "http://purl.org/dc/terms/",
            "sc": "https://schema.org/",
            "citeAs": "cr:citeAs",
            "column": "cr:column",
            "conformsTo": "dct:conformsTo",
            "dataType": {"@id": "cr:dataType", "@type": "@vocab"},
            "extract": "cr:extract",
            "field": "cr:field",
            "fileObject": "cr:fileObject",
            "fileSet": "cr:fileSet",
            "key": "cr:key",
            "recordSet": "cr:recordSet",
            "source": "cr:source",
        },
        "@type": "Dataset",
        "name": base_meta.get("title"),
        # Croissant hard-requires `distribution`, so only claim conformance when there's at
        # least one file to back it -- a fileless publication is still a valid plain
        # schema.org/Dataset, just not a Croissant one.
        "conformsTo": "http://mlcommons.org/croissant/1.0" if has_files else None,
        "description": base_meta.get("description"),
        "citeAs": _get_cite_as(base_meta, doi, project_id, request),
        "license": _get_license(base_meta, project_id),
        # Every publication this view serves is published to the public, unauthenticated Tapis
        # download route built in _get_distribution -- there's no embargo/access-tier concept in
        # the publish workflow, so this is unconditionally true rather than sourced from
        # base_meta. Revisit if/when a restricted-access publication type is introduced.
        "isAccessibleForFree": True,
        "url": _get_landing_page_url(project_id, request),
        "identifier": f"https://doi.org/{doi}" if doi else _get_landing_page_url(project_id, request),
        "creator": creators,
        "publisher": {
            "@type": "Organization",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
        },
        "keywords": base_meta.get("keywords"),
        "datePublished": base_meta.get("publicationDate") or base_meta.get("publication_date"),
        # Sourced from Publication.version (project_publish_operations.py bumps this on every
        # republish), not from the URL's own `vN` suffix (see public_data/urls.py's `revision`
        # group) -- Publication is keyed by bare project_id and update_or_create'd in place on
        # republish, so it never retains old versions' value/tree. A stale `revision` in the URL
        # (e.g. a DOI minted against v2, visited after a v3 republish) would still resolve here
        # and render v3's content throughout, so claiming the URL's version number would
        # contradict every other field in this same document. pub.version is the only value
        # that's ever consistent with the content actually being rendered.
        "version": pub.version,
        "includedInDataCatalog": {
            "@type": "DataCatalog",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
        },
        "distribution": _get_distribution(base_meta, project_id, request),
        "recordSet": _get_record_sets(base_meta),
    }

    # Drop empty/unset fields so the JSON-LD stays clean
    schema_org_json = {k: v for k, v in schema_org_json.items() if v not in (None, [], "")}

    # `distribution` is only required when the publication actually has files to list -- see
    # the `has_files` note above. REQUIRED_DATASET_FIELDS (name/description) apply either way --
    # they're baseline Google Dataset Search requirements, not a Croissant-specific claim.
    required_fields = list(REQUIRED_DATASET_FIELDS) + (
        list(REQUIRED_CROISSANT_FIELDS)
        if has_files
        else [field for field in REQUIRED_CROISSANT_FIELDS if field != "distribution"]
    )
    missing = [field for field in required_fields if field not in schema_org_json]

    # `url` (and `identifier`, when there's no DOI to use instead) both fall back to
    # PORTAL_PUBLICATION_DATACITE_URL_PREFIX via _get_landing_page_url. That fallback goes
    # through request.build_absolute_uri, which always yields *some* absolute-looking string
    # even when the setting is unset/blank -- so an unconfigured prefix can't be caught by
    # checking for an empty value in schema_org_json the way the other required fields are.
    # Check the setting directly instead.
    if not settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX:
        missing.append("url")
        if not doi:
            missing.append("identifier")

    if missing:
        # Only blame the Croissant claim specifically when a Croissant-only field is what's
        # actually missing -- a missing name/description fails Google's baseline Dataset
        # requirements regardless of whether this publication has files to be Croissant about.
        reason = (
            "it cannot honestly claim conformsTo http://mlcommons.org/croissant/1.0"
            if has_files and any(field in missing for field in REQUIRED_CROISSANT_FIELDS)
            else "its published Dataset metadata is incomplete"
        )
        fix_hints = {
            "name": "the publication's title",
            "description": "the publication's description",
            "distribution": "its file listing",
            "url": "the PORTAL_PUBLICATION_DATACITE_URL_PREFIX setting",
            "identifier": "the PORTAL_PUBLICATION_DATACITE_URL_PREFIX setting",
        }
        # dict.fromkeys dedupes while keeping order, so when `url` and `identifier` are
        # missing for the same underlying reason (an unconfigured prefix), the hint only
        # names that setting once instead of twice.
        hints = ", ".join(dict.fromkeys(fix_hints[field] for field in missing if field in fix_hints))
        where = f" (check {hints})" if hints else ""
        if "identifier" in missing and not doi:
            where += " or give the publication a DOI"
        raise SchemaOrgValidationError(
            f"Publication {project_id} is missing required schema.org Dataset field(s) "
            f"{', '.join(missing)}; {reason}. Fix the publication's metadata{where} before "
            "this page's JSON-LD can be trusted."
        )

    return schema_org_json


def get_citation_context(pub, request):
    """Get Dublin Core and Google Scholar (citation_*) metadata, plus the schema.org JSON-LD
    payload, for a published project's page <head>. The citation_* tags follow the Highwire
    Press convention Google Scholar's indexing guide documents
    (https://scholar.google.com/intl/en/scholar/inclusion.html#indexing).
    """

    # Built first so its already-resolved `url` and `distribution` (with real, absolute
    # download URLs) can be reused below instead of recomputed.
    schema_org_json = get_schema_org_json(pub, pub.project_id, request)

    base_meta = pub.value
    authors = base_meta.get("authors", [])
    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date")

    citation_meta = {}
    citation_meta["keywords"] = ", ".join(base_meta.get("keywords", []))
    citation_meta["entities"] = [
        {
            "title": base_meta.get("title"),
            "description": base_meta.get("description"),
            "doi": base_meta.get("doi"),
            "authors": authors,
            # One "Last, First" string per author -- the template emits one <meta
            # name="citation_author"> tag per entry, as Scholar's guide asks for.
            "citation_authors": [
                name for name in (_format_citation_author(author) for author in authors) if name
            ],
            "publication_date": publication_date,
            "citation_date": _format_citation_date(publication_date),
            "pdf_url": _get_citation_pdf_url(schema_org_json.get("distribution", [])),
            "abstract_url": schema_org_json.get("url"),
        }
    ]

    pub_title = base_meta["title"]
    return citation_meta, schema_org_json, pub_title


def dumps_json_ld(schema_org_json):
    """Serialize a JSON-LD payload for safe embedding in a `<script>` tag."""

    return json.dumps(schema_org_json).translate(_JSON_LD_HTML_ESCAPES)


class SchemaOrgValidationError(Exception):
    """Raised when a publication's metadata can't satisfy the schema.org/Croissant fields
    get_schema_org_json claims to emit."""


class IndexView(TemplateView):
    """
    Main workbench view.
    """

    template_name = "portal/apps/workbench/index.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        project_id = kwargs.get("project_id")
        if project_id:
            try:
                pub = Publication.objects.get(project_id=project_id)
                # `revision` (the URL's `vN` suffix -- see public_data/urls.py) can't select a
                # specific version's content: Publication is keyed by bare project_id and always
                # holds only the latest republish (see get_schema_org_json's `version` comment).
                # A mismatch means this link was minted against an older version that's since
                # been superseded and is now silently rendering the current version instead --
                # worth knowing about even though there's no old content left to serve.
                revision = kwargs.get("revision")
                if revision is not None and int(revision) != pub.version:
                    logger.warning(
                        f"Publication {project_id} was requested at revision {revision}, but "
                        f"its current version is {pub.version}; serving current content."
                    )
                citation_context, schema_org_json, _ = get_citation_context(pub, self.request)
                context["schema_org_json"] = dumps_json_ld(schema_org_json)
                context["citation_context"] = citation_context
                context["publisher"] = settings.PORTAL_PUBLICATION_PUBLISHER
            except Publication.DoesNotExist:
                # Unlike the catch-all fallback route (public_data/urls.py's `index_fallback`,
                # which never captures a project_id and legitimately needs to keep rendering
                # this same shell for the SPA's other in-app views), landing here means the URL
                # matched the specific `{published_prefix}.{project_id}` pattern and named a
                # project_id that doesn't exist. That's a real not-found, not a client-side
                # route Django doesn't otherwise know about -- serving it as a 200 (as this used
                # to) is exactly the soft-404 pattern Google's own guidance asks sites to avoid
                # in favor of a genuine 404 status.
                raise Http404(f"No publication found for project {project_id}")
            except Exception as e:
                logger.exception(f"Failed to build meta tags for project {project_id}: {e}")
        context["setup_complete"] = (
            False if self.request.user.is_anonymous else self.request.user.profile.setup_complete
        )
        context["DEBUG"] = settings.DEBUG
        return context

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


class DataciteJsonPreviewView(View):
    """Plain-text preview of the DataCite payload and schema.org JSON-LD for a published project."""

    def get(self, request, project_id, *args, **kwargs):
        try:
            pub = Publication.objects.get(project_id=project_id)
        except Publication.DoesNotExist:
            raise Http404(f"No publication found for project {project_id}")

        pub_tree = nx.node_link_graph(pub.tree)
        datacite_json = get_datacite_json(pub_tree)

        try:
            schema_org_body = json.dumps(get_schema_org_json(pub, project_id, request), indent=2)
        except SchemaOrgValidationError as e:
            schema_org_body = f"INVALID: {e}"

        body = (
            "# DataCite payload (submitted to DataCite on publish)\n"
            # f"{json.dumps(datacite_json, indent=2)}\n"
            # "\n"
            "# schema.org/Dataset JSON-LD (for Google Dataset Search)\n"
            f"{schema_org_body}\n"
        )

        return HttpResponse(body, content_type="text/plain")
