import json
import logging
import mimetypes
import posixpath
import re
from urllib.parse import quote

import requests
from django.conf import settings
from django.http import Http404, HttpResponse, HttpResponseRedirect, StreamingHttpResponse
from django.urls import NoReverseMatch, reverse
from django.utils.html import escape
from django.utils.http import content_disposition_header
from django.views.generic.base import TemplateView, View

from portal.apps.projects.schema_models.license_urls import resolve_license_url
from portal.apps.public_data.origin import get_configured_origin
from portal.apps.publications.models import Publication

logger = logging.getLogger(__name__)

# The only properties Google Dataset Search hard-requires on a schema.org/Dataset. These are
# the only fields whose absence makes get_schema_org_json raise -- which leaves the landing
# page noindex with no JSON-LD and out of the sitemap -- since without them there's no valid
# Dataset to emit at all.
REQUIRED_DATASET_FIELDS = ("name", "description")

# Properties Croissant (http://mlcommons.org/croissant/1.0) additionally requires on a
# conformant Dataset. When any of these is missing, get_schema_org_json still emits the plain
# schema.org Dataset -- it's still valid, and still eligible for Dataset Search -- but drops
# the `conformsTo` claim rather than asserting Croissant conformance it doesn't have.
# `url`/`identifier` are also Croissant-required, but always present: they come from
# _get_landing_page_url, which can't return an empty value (see the comment in
# get_schema_org_json).
REQUIRED_CROISSANT_FIELDS = ("license", "creator", "datePublished", "distribution")

# Croissant also requires a content checksum on every cr:FileObject in `distribution` -- either of
# these properties satisfies it (mlcroissant: "At least one of these properties should be defined:
# ['md5', 'sha256']"). A Dataset with any unhashed file is emitted without `conformsTo` too.
CROISSANT_FILE_CHECKSUM_FIELDS = ("md5", "sha256")

CROISSANT_1_0 = "http://mlcommons.org/croissant/1.0"

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

# Published files are relayed to the client in chunks of this size rather than buffered whole
# (tapipy's files.getContents returns the entire file as one bytes object), since a published
# dataset's files can run to multiple GB.
_FILE_STREAM_CHUNK_SIZE = 64 * 1024


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
    resolved = resolve_license_url(license_value)
    if resolved is None:
        raise SchemaOrgValidationError(
            f"Publication {project_id} has license {license_value!r}, which has no entry in "
            "LICENSE_URLS (projects/schema_models/license_urls.py) and isn't itself a URL. "
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


def _get_configured_origin(request):
    """Return the "scheme://host" that file/distribution URLs should be built against, so they
    can never end up on a different domain than the one `_get_landing_page_url` resolves `url`/
    `identifier`/`citeAs` against.

    PORTAL_PUBLICATION_DATACITE_URL_PREFIX, when configured as an absolute URL, can legitimately
    point at a different host than the one that served this request -- e.g. one deployment's
    settings file sets it to "https://cep.test/data/tapis/projects/...", a host distinct from
    wherever Django itself is actually reached. Building distribution/contentUrl from
    request.build_absolute_uri instead -- the current request's own host -- would silently put
    the dataset's `url` and its file download links on two different domains, which is
    inconsistent for Croissant. Falls back to the current request's own scheme+host (the
    pre-existing behavior) when the prefix is unset or isn't itself an absolute URL, matching
    `_get_landing_page_url`'s own fallback for the same setting.

    This only guarantees the two land on the same *host* -- it says nothing about path. Google
    Scholar's stricter requirement that citation_pdf_url live in the same subdirectory as the
    citing landing page is handled separately, by building every published-file URL through
    `_get_publication_file_url` -- see its docstring.
    """

    return get_configured_origin() or request.build_absolute_uri("/").rstrip("/")


def _format_content_size(num_bytes):
    """Format a byte count as Croissant/schema.org's `contentSize` expects -- schema.org's own
    docs describe the property as "File size in (mega/kilo)bytes", and both its and Croissant's
    published examples use a scaled, human-readable unit (e.g. "18MB"), not a raw byte count.
    A bare "<n> B" value is technically valid Text but unreadable at real file sizes, so this
    scales to the largest unit that keeps the mantissa under 1024, matching the convention
    those examples use.
    """

    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1024 or unit == "TB":
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024


def _get_distribution(file_objs, project_id, request):
    """Build the Croissant/schema.org `distribution` list (one cr:FileObject per published file)
    from `file_objs` -- _get_publication_file_objs' combined list, so files attached to entity
    nodes are listed alongside root-level ones, and every file listed here is one the
    PublicationFileDownloadView allow-list serves. Each `contentUrl` points at that view, which
    returns the file's own bytes -- Croissant consumers (and Google Dataset Search) fetch
    `contentUrl` expecting the file itself, not the datafiles app's generic download route, which
    returns a JSON envelope around a short-lived Tapis postit link for the SPA to follow.

    Directory file objects are skipped: listing their contents would mean a Tapis listing call
    on every page render. Files inside an associated directory are still downloadable (the
    allow-list accepts them) but aren't enumerated here.
    """

    distribution = []
    for file_obj in file_objs:
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue

        # `@id` is a JSON-LD identifier that (per the Croissant spec's own examples) doubles as
        # an IRI reference resolved against this document's own URL, so it's percent-encoded
        # the same way reverse() encodes this path inside `contentUrl` -- otherwise it would be
        # an invalid IRI for any path containing characters (spaces, etc.) that aren't legal
        # unescaped in one. `contentUrl` takes the raw path; reverse() does its own encoding.
        content_url = _get_publication_file_url(project_id, path, request)
        if content_url is None:
            continue
        file_object = {
            "@type": "cr:FileObject",
            "@id": quote(path),
            "name": name,
            "contentUrl": content_url,
        }

        # Croissant requires encodingFormat on every FileObject -- fall back to the generic
        # "unknown binary" MIME type rather than omitting the field when the name's extension
        # isn't recognized, so this never silently drops a required property.
        encoding_format, _ = mimetypes.guess_type(name)
        file_object["encodingFormat"] = encoding_format or "application/octet-stream"
        if file_obj.get("length") is not None:
            file_object["contentSize"] = _format_content_size(file_obj["length"])
        # Only present once a publish-time hashing step populates it (see FileObj.sha256) --
        # computing it here would mean downloading every file on every page request.
        if file_obj.get("sha256"):
            file_object["sha256"] = file_obj["sha256"]

        distribution.append(file_object)

    return distribution


def _get_cover_image_url(base_meta, project_id, request):
    """Build an absolute URL for the publication's cover image, for og:image/twitter:image
    (link-unfurl preview cards in Slack/Discord/LinkedIn/X/iMessage).

    Points at PublicationCoverImageView (public_data/urls.py's `cover_image` pattern) rather
    than the datafiles app's generic download route: unfurlers fetch og:image expecting image
    bytes, and that route returns a JSON envelope around a Tapis postit link instead. The view
    reads the stored `coverImage` path itself, so the URL only needs the project_id.
    Returns None when there's no cover image to serve, so the template omits the tags.
    """

    if not (base_meta.get("coverImage") or "").lstrip("/"):
        return None
    if not settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME:
        return None

    url_path = reverse("publications:cover_image", kwargs={"project_id": project_id})
    return f"{_get_configured_origin(request)}{url_path}"


def _get_record_sets(file_objs):
    """Build the Croissant `recordSet` list (one cr:RecordSet per tabular file that has known
    columns) from `file_objs` -- the same combined list `distribution` is built from, so every
    recordSet's `source.fileObject` resolves to a `distribution` entry. This only ever reads
    metadata already stored on `fileObjs` (the `columns` field, populated at publish time for
    recognized tabular formats) -- it does no file I/O of its own, since this runs on every
    page request. Files with no known columns are simply skipped, so a publication with no
    extracted schemas yet degrades to no `recordSet` at all rather than a broken one.
    """

    record_sets = []
    for file_obj in file_objs:
        columns = file_obj.get("columns")
        path = (file_obj.get("path") or "").lstrip("/")
        if not columns or not path:
            continue

        # Percent-encoded the same way _get_distribution encodes this same file's
        # cr:FileObject "@id" (see its comment), so `source.fileObject.@id` below actually
        # cross-references the matching `distribution` entry instead of silently failing to
        # match it for any path containing characters that aren't legal unescaped in an IRI.
        encoded_path = quote(path)
        record_sets.append(
            {
                "@type": "cr:RecordSet",
                "@id": f"{encoded_path}/records",
                "name": file_obj.get("name"),
                "field": [
                    {
                        "@type": "cr:Field",
                        "@id": f"{encoded_path}/{quote(column['name'])}",
                        "name": column["name"],
                        "dataType": column.get("dataType", "sc:Text"),
                        "source": {
                            # Links back to the matching entry this same publication's
                            # `distribution` emits in _get_distribution, whose "@id" is
                            # also the file's percent-encoded stripped path.
                            "fileObject": {"@id": encoded_path},
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

    The path always comes from reversing public_data/urls.py's own `index` pattern (in the
    "publications" namespace, i.e. the `published-datasets/` mount) -- the one Django route that
    actually renders this page's JSON-LD/citation meta tags, via IndexView -- rather than hand-
    concatenating PORTAL_PUBLICATION_DATACITE_URL_PREFIX and project_id the way this used to.
    That concatenation could (and for at least one deployment, did) produce a URL nothing
    actually serves: PORTAL_PUBLICATION_DATACITE_URL_PREFIX defaults to None (settings.py) and is
    "" in some deployments' settings, and is set to an unrelated path in at least one other --
    none of which line up with where public_data/urls.py's `index` pattern actually matches.
    reverse() can't drift from that route the way a hand-built string could.

    Only the origin is still deployment-configurable, via the same PORTAL_PUBLICATION_
    DATACITE_URL_PREFIX-driven host _get_configured_origin already resolves for file/distribution
    URLs -- see its docstring for why a deployment can be reachable at a different public host
    than the one serving this request.
    """

    path = reverse("publications:index", kwargs={"project_id": project_id})
    return f"{_get_configured_origin(request)}{path}"


def _get_publication_file_url(project_id, path, request):
    """Build the same-subdirectory-as-the-landing-page URL for one published file, via public_
    data/urls.py's `file_download` pattern -- nested directly under the same path `_get_landing_
    page_url` resolves `index` against, so a file served from here can never end up outside the
    landing page's own subdirectory the way the datafiles app's generic `/api/datafiles/tapis/
    download/...` route can. Used for both citation_pdf_url and Croissant's `distribution`/
    `contentUrl`, so a crawler following either one gets the file's own bytes -- see
    PublicationFileDownloadView's docstring.

    `path` must be the file's raw (not percent-encoded) path: reverse() percent-encodes its own
    kwargs, so passing an already-quote()'d path here would double-encode it.

    Returns None (and logs) if the route can't express `path`, and callers skip that one file:
    a NoReverseMatch escaping from here would fail the whole page's JSON-LD -- leaving the
    landing page noindex and out of the sitemap -- over a single file. The route accepts any
    character (see public_data/urls.py), so this is a guard against future pattern changes.
    """

    try:
        url_path = reverse("publications:file_download", kwargs={"project_id": project_id, "path": path})
    except NoReverseMatch:
        logger.warning(f"Publication {project_id}: no file_download URL for {path!r}; omitting that file.")
        return None
    return f"{_get_configured_origin(request)}{url_path}"


def _get_cite_as(base_meta, doi, project_id, request):
    """Build a plain-text citation for the Croissant `citeAs` property, following DataCite's
    recommended citation format (Creator(s) (PublicationYear). Title. Publisher. Identifier),
    from metadata already available on the publication so it can't go stale like a hand-written
    placeholder would.
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


def _get_citations(base_meta):
    """Build the schema.org `citation` list -- CreativeWork entries for academic articles the
    data provider recommends citing in addition to the dataset itself
    (https://developers.google.com/search/docs/appearance/structured-data/dataset) -- from the
    publication's `relatedPublications` entries. This is a distinct property from Croissant's
    own `citeAs` (built by _get_cite_as above): `citeAs` says how to cite *this* dataset,
    `citation` recommends *other* works to cite alongside it.

    Only "context" and "linked_dataset" entries are used: those describe a publication this
    dataset was produced in the context of (DataCite's IsDocumentedBy/IsPartOf relation --
    see get_related_identifiers in datacite_operations.py) -- i.e. something worth citing
    alongside the dataset. "cited_by" entries run the other direction (other work that cites
    *this* dataset) and so aren't a citation recommendation to make about this dataset's own
    page.
    """

    citations = []
    for r_data in base_meta.get("relatedPublications", []):
        if r_data.get("publicationType") not in ("context", "linked_dataset"):
            continue
        title = r_data.get("publicationTitle")
        if not title:
            continue

        doi = r_data.get("publicationDoi")
        citation = {
            "@type": "CreativeWork",
            "name": title,
            "author": r_data.get("publicationAuthor"),
            "datePublished": r_data.get("publicationDateOfPublication"),
            "url": r_data.get("publicationLink"),
            # Prefer the DOI (a stabler, more citable identifier than a plain link) when one's
            # given -- same "https://doi.org/<doi>" form used for the dataset's own `identifier`
            # elsewhere in this module.
            "identifier": f"https://doi.org/{doi}" if doi else None,
        }
        if r_data.get("publicationPublisher"):
            citation["publisher"] = {"@type": "Organization", "name": r_data["publicationPublisher"]}
        citations.append({k: v for k, v in citation.items() if v not in (None, "")})

    return citations


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


def _get_citation_pdf_url(file_objs, project_id, request):
    """Pick the first PDF out of `file_objs` (_get_publication_file_objs' combined list, so a PDF
    attached to an entity node is found too), for Google Scholar's citation_pdf_url.

    Scholar requires citation_pdf_url to resolve in the same subdirectory as the citing landing
    page, which _get_publication_file_url's `file_download` route guarantees -- the same route
    `distribution`/`contentUrl` is built against, so the two always agree.
    """

    for file_obj in file_objs:
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue
        encoding_format, _ = mimetypes.guess_type(name)
        if encoding_format == "application/pdf":
            pdf_url = _get_publication_file_url(project_id, path, request)
            if pdf_url:
                return pdf_url
    return None


def get_schema_org_json(pub, project_id, request):
    """Build a schema.org/Dataset JSON-LD object for a published project to embed directly in
    the page's <script type="application/ld+json"> tag for Google Dataset Search.
    """

    base_meta = pub.value
    doi = base_meta.get("doi")
    # Root-level and entity-node files together -- see _get_publication_file_objs.
    file_objs = _get_publication_file_objs(pub)

    # A metadata-only / externally-hosted publication can legitimately have no files at all, and
    # so is never a Croissant candidate. Having files that failed to make it into `distribution`
    # (missing name/path on every fileObj) is a data bug instead -- worth a warning below.
    has_files = any(file_obj.get("type") == "file" for file_obj in file_objs)

    # An unmapped license label is a misconfiguration (see _get_license), but not one worth
    # dropping the whole page from search over: log it, and emit the Dataset without `license`
    # (which also withholds `conformsTo` below, since Croissant requires it).
    try:
        license_url = _get_license(base_meta, project_id)
    except SchemaOrgValidationError as e:
        logger.error(f"{e} Emitting this publication's Dataset without `license` or `conformsTo` meanwhile.")
        license_url = None

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
        # Provisional -- removed below unless every REQUIRED_CROISSANT_FIELDS entry made it into
        # the final document. Set here only to keep its position in the serialized output.
        "conformsTo": CROISSANT_1_0,
        "description": base_meta.get("description"),
        "citeAs": _get_cite_as(base_meta, doi, project_id, request),
        # Distinct from `citeAs` above -- see _get_citations' docstring. Optional/recommended
        # per Google's own Dataset structured-data guidance, not Croissant-required, so an empty
        # list here is fine and gets dropped by the empty-field cleanup below like `keywords`.
        "citation": _get_citations(base_meta),
        "license": license_url,
        # Every publication this view serves is published to the public, unauthenticated Tapis
        # download route built in _get_distribution -- there's no embargo/access-tier concept in
        # the publish workflow, so this is unconditionally true rather than sourced from
        # base_meta. Revisit if/when a restricted-access publication type is introduced.
        "isAccessibleForFree": True,
        "url": _get_landing_page_url(project_id, request),
        "identifier": f"https://doi.org/{doi}" if doi else _get_landing_page_url(project_id, request),
        # Recommended by both schema.org/Croissant -- a canonical URL for this exact dataset's
        # identity, distinct from `url` (the landing *page*, which could theoretically move).
        # Only worth stating when there's a real DOI to point at: with no DOI, `identifier`
        # already falls back to this same landing-page `url` above, and sameAs===url would be a
        # vacuous "same as itself" claim rather than a second, independent identity URL. Dropped
        # by the empty-field cleanup below when doi is falsy, like `keywords`/`citation`.
        "sameAs": f"https://doi.org/{doi}" if doi else None,
        "creator": creators,
        "publisher": {
            "@type": "Organization",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
        },
        "keywords": base_meta.get("keywords"),
        "datePublished": base_meta.get("publicationDate") or base_meta.get("publication_date"),
        # Publication.last_updated (auto_now=True) already backs the sitemap's <lastmod> for
        # this same publication -- reusing it here rather than sourcing from base_meta means
        # `dateModified` tracks every republish (project_publish_operations.py's update_or_create)
        # automatically, with no separate metadata field to keep in sync.
        "dateModified": pub.last_updated.isoformat() if pub.last_updated else None,
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
        "distribution": _get_distribution(file_objs, project_id, request),
        "recordSet": _get_record_sets(file_objs),
    }

    # Drop empty/unset fields so the JSON-LD stays clean
    schema_org_json = {k: v for k, v in schema_org_json.items() if v not in (None, [], "")}

    # `url` (and `identifier`, when there's no DOI to use instead) used to fall back to
    # PORTAL_PUBLICATION_DATACITE_URL_PREFIX directly, which could silently degrade to a
    # technically-absolute-but-meaningless URL when that setting was unset/blank -- not
    # something the empty-value checks below would catch. _get_landing_page_url now always
    # reverses public_data/urls.py's own `index` route instead (see its docstring), which can't
    # produce that kind of meaningless value: it's either a real, working landing-page URL, or
    # reverse() raises NoReverseMatch outright. So there's nothing left for this function to
    # separately guard against here.

    missing = [field for field in REQUIRED_DATASET_FIELDS if field not in schema_org_json]
    if missing:
        fix_hints = {"name": "the publication's title", "description": "the publication's description"}
        raise SchemaOrgValidationError(
            f"Publication {project_id} is missing required schema.org Dataset field(s) "
            f"{', '.join(missing)}; its published Dataset metadata is incomplete. Fix the "
            f"publication's metadata (check {', '.join(fix_hints[field] for field in missing)}) "
            "before this page can be indexed."
        )

    # Only claim Croissant conformance when every field Croissant requires actually made it in.
    # Otherwise this is still a valid plain schema.org Dataset, so it's emitted without the claim.
    croissant_missing = [field for field in REQUIRED_CROISSANT_FIELDS if field not in schema_org_json]
    if croissant_missing:
        del schema_org_json["conformsTo"]
        # A fileless publication was never a Croissant candidate, so there's nothing to report.
        if has_files:
            logger.warning(
                f"Publication {project_id} has files but is missing Croissant-required field(s) "
                f"{', '.join(croissant_missing)}, so its Dataset is emitted without conformsTo "
                f"{CROISSANT_1_0}."
            )
    # Every cr:FileObject also needs a checksum, or Croissant validators reject the whole Dataset.
    # Logged at debug, not warning: no publish-time hashing step populates FileObj.sha256 yet, so
    # today this applies to every publication with files, on every page render and sitemap build.
    elif unhashed := [
        file_object["@id"]
        for file_object in schema_org_json["distribution"]
        if not any(file_object.get(field) for field in CROISSANT_FILE_CHECKSUM_FIELDS)
    ]:
        del schema_org_json["conformsTo"]
        logger.debug(
            f"Publication {project_id} has {len(unhashed)} file(s) with no md5/sha256 checksum (e.g. "
            f"{unhashed[0]}), so its Dataset is emitted without conformsTo {CROISSANT_1_0}."
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
    # `keywords` (base_metadata.py) is typed `str | list[str] | None` -- the DPMP form stores it
    # as a single free-text, comma-separated string, not a list, so joining unconditionally
    # would join its individual characters instead of leaving it alone. Only join when it's
    # actually a list; pass a string straight through.
    kw = base_meta.get("keywords") or ""
    citation_meta["keywords"] = ", ".join(kw) if isinstance(kw, list) else kw
    # Page-level (not per-entity, like `keywords` above) since og:image/twitter:image are
    # single tags in <head>, not part of the citation_* block.
    citation_meta["cover_image_url"] = _get_cover_image_url(base_meta, pub.project_id, request)
    citation_meta["entities"] = [
        {
            "title": base_meta.get("title"),
            "description": base_meta.get("description"),
            "doi": base_meta.get("doi"),
            "authors": authors,
            # Dublin Core wants DC.identifier to be a resolvable URI, not a bare DOI -- reuse
            # the same DOI-URL-or-landing-page value already resolved for the JSON-LD
            # `identifier` field above instead of recomputing (and risking drift from) it here.
            "identifier": schema_org_json.get("identifier"),
            # DC.rights wants a URI too -- reuse the same canonical license-deed URL already
            # resolved (via _get_license) for the JSON-LD `license` field above, rather than
            # re-resolving (and risking drift from) it here.
            "license": schema_org_json.get("license"),
            # One "First Last" string per author -- the template emits one <meta
            # name="DC.creator"> tag per entry, per Dublin Core's (unqualified/simple) creator
            # convention, the same way it already does for citation_author below.
            "dc_creators": [
                name
                for name in (
                    f"{author.get('first_name', '')} {author.get('last_name', '')}".strip() for author in authors
                )
                if name
            ],
            # One "Last, First" string per author -- the template emits one <meta
            # name="citation_author"> tag per entry, as Scholar's guide asks for.
            "citation_authors": [name for name in (_format_citation_author(author) for author in authors) if name],
            "publication_date": publication_date,
            "citation_date": _format_citation_date(publication_date),
            "pdf_url": _get_citation_pdf_url(_get_publication_file_objs(pub), pub.project_id, request),
            "abstract_url": schema_org_json.get("url"),
        }
    ]

    pub_title = base_meta["title"]
    return citation_meta, schema_org_json, pub_title


def dumps_json_ld(schema_org_json):
    """Serialize a JSON-LD payload for safe embedding in a `<script>` tag."""

    return json.dumps(schema_org_json).translate(_JSON_LD_HTML_ESCAPES)


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
                # Reuse the same _get_landing_page_url-derived value already resolved for the
                # JSON-LD's own `url` (rather than falling back to base.html's default
                # request.build_absolute_uri) so <link rel="canonical">/og:url can't disagree
                # with what this same page's structured data claims as its URL -- see
                # _get_landing_page_url's docstring for why that's not just the current
                # request's own URL (a stale ?vN revision link, or a deployment where
                # PORTAL_PUBLICATION_DATACITE_URL_PREFIX points at a different host than the
                # one serving this request).
                context["canonical_url"] = schema_org_json.get("url")
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


def _get_publication_file_objs(pub):
    """Every file object associated anywhere in the publication, deduplicated by path.

    Files are associated with whichever project-graph node their folder belongs to
    (libs/agave/operations.py's upload: an entity's own `fileObjs` when the folder is an entity,
    the project root's otherwise), and publish_project's _add_values_to_tree copies each entity's
    value into its node in `Publication.tree`. So `pub.value["fileObjs"]` alone only covers files
    attached directly to the project root -- the entity nodes in `pub.tree` hold the rest.
    """

    file_objs = list(pub.value.get("fileObjs") or [])
    # `tree` is networkx node_link_data: {"nodes": [{"id": ..., "value": {...}}, ...], ...}
    for node in (pub.tree or {}).get("nodes", []):
        file_objs.extend((node.get("value") or {}).get("fileObjs") or [])

    by_path = {}
    for file_obj in file_objs:
        path = (file_obj.get("path") or "").strip("/")
        if path:
            by_path.setdefault(path, file_obj)
    return list(by_path.values())


def _is_publication_file_path(pub, path):
    """Whether `path` (relative to the published system) is a file this publication declares:
    either a file object's own path, or a path inside a directory file object. Anything else --
    files on the published system that were never associated with the publication, the
    directory paths themselves, or `.`/`..`/empty segments that could resolve somewhere other
    than they appear to -- is rejected.
    """

    if any(segment in ("", ".", "..") for segment in path.split("/")):
        return False
    for file_obj in _get_publication_file_objs(pub):
        file_obj_path = file_obj["path"].strip("/")
        if file_obj.get("type") == "file" and path == file_obj_path:
            return True
        if file_obj.get("type") == "dir" and path.startswith(f"{file_obj_path}/"):
            return True
    return False


def _get_published_workspace_id(project_id, version):
    """Return the `{project_id}` / `{project_id}v{version}` id publish_project
    (project_publish_operations.py) gives a version's published workspace -- the suffix of its
    Tapis system id, and its directory under PORTAL_PROJECTS_PUBLISHED_ROOT_DIR. Version 1 has no
    suffix; every republish gets its own `v{version}` workspace.
    """

    suffix = f"v{version}" if version and version > 1 else ""
    return f"{project_id}{suffix}"


def _get_published_system_id(project_id, version):
    """Return the Tapis system a publication's current version was published to. Must match
    publish_project (project_publish_operations.py): version 1 publishes to
    `{prefix}.{project_id}`, every republish to its own `{prefix}.{project_id}v{version}` system.
    Publication.version is the version publish_project last wrote, so this always points at the
    files the landing page's metadata describes -- not version 1's.
    """

    return f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{_get_published_workspace_id(project_id, version)}"


def _get_published_web_url(path):
    """Return the public HTTP URL for `path` (relative to PORTAL_PROJECTS_PUBLISHED_ROOT_DIR) on
    the deployment's web mirror of that directory -- PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL, e.g.
    web.corral -- or None when no mirror is configured. Every segment is percent-encoded, so a
    stored path can't change the redirect's host or add a query string/fragment.
    """

    base_url = settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL
    if not base_url:
        return None
    return f"{base_url.rstrip('/')}/{quote(path.lstrip('/'))}"


def _stream_published_file(system, path):
    """Relay one published file's bytes from the Tapis Files content endpoint as a streaming
    response, so a crawler (Scholar, Croissant/Dataset Search consumers, link unfurlers) that
    follows a published-file URL gets the file itself. Only used when the deployment has no
    PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL mirror to redirect to instead (see
    PublicationFileDownloadView) -- relaying a multi-GB file holds a uWSGI worker for the whole
    download.

    The datafiles app's `download` operation (TapisFilesView) can't be reused for this: it
    creates a Tapis postit link and returns it inside a JSON envelope for the SPA's own
    JavaScript to follow, which a crawler never does. Uses the service account's token, the same
    credentials TapisFilesView already falls back to for anonymous reads of published systems.
    """

    try:
        upstream = requests.get(
            f"{settings.TAPIS_TENANT_BASEURL}/v3/files/content/{system}/{quote(path)}",
            headers={"X-Tapis-Token": settings.TAPIS_ADMIN_JWT},
            stream=True,
            timeout=(10, 60),
        )
    except requests.RequestException:
        logger.exception(f"Failed to reach Tapis for published file {system}/{path}")
        return HttpResponse(status=502)

    if not upstream.ok:
        upstream.close()
        # 404 for a missing path, 400 for a directory (the content endpoint only serves
        # directories as a zip on request) -- neither is a servable file.
        if upstream.status_code in (400, 404):
            raise Http404(f"No published file at {system}/{path}")
        logger.error(f"Tapis returned {upstream.status_code} for published file {system}/{path}")
        return HttpResponse(status=502)

    def body():
        try:
            yield from upstream.iter_content(chunk_size=_FILE_STREAM_CHUNK_SIZE)
        finally:
            upstream.close()

    file_name = posixpath.basename(path)
    content_type, _ = mimetypes.guess_type(file_name)
    response = StreamingHttpResponse(body(), content_type=content_type or "application/octet-stream")
    # inline, not attachment: a PDF or cover image should render in the browser/unfurler.
    response["Content-Disposition"] = content_disposition_header(False, file_name)
    if upstream.headers.get("Content-Length"):
        response["Content-Length"] = upstream.headers["Content-Length"]
    return response


class PublicationFileDownloadView(View):
    """Serve one published file's bytes at a URL nested under its publication's own
    landing-page path (public_data/urls.py's `file_download` pattern), rather than the datafiles
    app's generic `/api/datafiles/tapis/download/...` route. Two reasons: Google Scholar requires
    citation_pdf_url to resolve in the same subdirectory as the citing landing page, and every
    consumer of citation_pdf_url/`contentUrl` expects the file itself -- see
    _stream_published_file's docstring for why the generic route can't provide that.

    When PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL is configured, this redirects (302) to the file
    on that public web mirror (e.g. web.corral), which serves byte ranges and multi-GB files
    directly -- the URL in citation_pdf_url/`contentUrl` stays under the landing page's own path
    either way. Otherwise it falls back to relaying the bytes from Tapis.

    Only serves paths the publication itself declares (_is_publication_file_path), checked
    before any redirect or Tapis call: without the check this route would relay (with the
    service account's token) or point at any path on the published system -- including files
    never associated with the publication -- and send every crawler-guessed URL onward.
    """

    def get(self, request, project_id, path):
        pub = Publication.objects.filter(project_id=project_id).first()
        if pub is None:
            raise Http404(f"No publication found for project {project_id}")
        if not _is_publication_file_path(pub, path):
            raise Http404(f"Publication {project_id} has no file at {path}")
        web_url = _get_published_web_url(f"{_get_published_workspace_id(project_id, pub.version)}/{path}")
        if web_url:
            return HttpResponseRedirect(web_url)
        return _stream_published_file(_get_published_system_id(project_id, pub.version), path)


class PublicationCoverImageView(View):
    """Serve a publication's cover image bytes, for og:image/twitter:image. The image lives on
    the shared PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME system (project_publish_operations.py's
    _transfer_cover_image copies it there), not the per-project published system
    PublicationFileDownloadView reads from, so it gets its own route. The path is read from the
    stored publication rather than the URL, so this can't be used to read anything else off that
    shared system. Redirects to the web mirror when one is configured, the same way
    PublicationFileDownloadView does -- the root system's rootDir is the mirror's root.
    """

    def get(self, request, project_id):
        root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
        pub = Publication.objects.filter(project_id=project_id).first()
        cover_image_path = ((pub.value.get("coverImage") if pub else None) or "").lstrip("/")
        if not root_system or not cover_image_path:
            raise Http404(f"No cover image for publication {project_id}")
        web_url = _get_published_web_url(cover_image_path)
        if web_url:
            return HttpResponseRedirect(web_url)
        return _stream_published_file(root_system, cover_image_path)


class SchemaOrgValidationError(Exception):
    """Raised when a publication's metadata can't satisfy the schema.org/Croissant fields
    get_schema_org_json claims to emit."""


class SitemapView(View):
    """XML sitemap (https://www.sitemaps.org/protocol.html) enumerating every published
    dataset's landing-page URL, so crawlers -- and Google Dataset Search's own onboarding
    guidance specifically recommends this for a dataset repository -- can discover publications
    that aren't otherwise linked from a crawlable page (the workbench UI that lists them is a
    client-rendered, authenticated-by-default SPA view).

    Deliberately hand-rolled rather than django.contrib.sitemaps.Sitemap: that framework always
    builds each <loc> as f"{protocol}://{domain}{location()}" against django.contrib.sites'
    configured Site (not installed here -- see INSTALLED_APPS), which in any case only knows a
    single domain -- whereas a publication's real landing-page URL is already resolved
    per-deployment by _get_landing_page_url (via PORTAL_PUBLICATION_DATACITE_URL_PREFIX), which
    some deployments point at a different host entirely. Reusing that same helper keeps every
    <loc> here byte-identical to the `url`/canonical link the corresponding page already claims
    for itself, instead of adding a second, independently-drifting way to build the same URL.

    Only lists publications whose landing page will actually be indexable. When
    get_citation_context fails for a publication (e.g. an unmapped license), IndexView logs it
    and renders that page as the generic `noindex` shell with no JSON-LD -- so listing it here
    would submit a URL Search Console then reports as "Submitted URL marked noindex". Running the
    same get_citation_context call IndexView makes, with the same broad except, keeps the two in
    step; each omission is logged at ERROR so the broken publication gets noticed and fixed
    instead of silently dropping out of search.
    """

    def get(self, request, *args, **kwargs):
        # Mirrors the is_published filter publications/views.py already uses for its own
        # (authenticated) publications listing.
        publications = Publication.objects.filter(is_published=True).order_by("project_id")

        entries = []
        for pub in publications:
            try:
                get_citation_context(pub, request)
            except Exception:
                logger.exception(
                    f"Sitemap omitted publication {pub.project_id}: its landing-page metadata failed "
                    "to build, so the page renders noindex with no JSON-LD. Fix the publication's "
                    "metadata to restore it to search."
                )
                continue
            loc = escape(_get_landing_page_url(pub.project_id, request))
            lastmod = (pub.last_updated or pub.created).date().isoformat()
            entries.append(f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n  </url>")

        # Sitemap protocol caps a single file at 50,000 URLs; this repository has nowhere near
        # that many publications today, so a <sitemapindex> of multiple files isn't implemented.
        body = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(entries)
            + ("\n" if entries else "")
            + "</urlset>\n"
        )
        return HttpResponse(body, content_type="application/xml")
