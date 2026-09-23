import json
import logging
import mimetypes
import re
from urllib.parse import quote, urlsplit

from django.conf import settings
from django.http import Http404, HttpResponse
from django.urls import reverse
from django.utils.html import escape
from django.views.generic.base import TemplateView, View

from portal.apps.datafiles.views import TapisFilesView
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

    This only guarantees the two land on the same *host* -- it says nothing about path, so it
    doesn't by itself satisfy Google Scholar's stricter requirement that citation_pdf_url live in
    the same subdirectory as the citing landing page (distribution/contentUrl's `/api/datafiles/
    tapis/download/...` path tree is unrelated to wherever the landing page itself is served).
    That's handled separately, by routing citation_pdf_url through `_get_publication_file_url`
    instead -- see its docstring.
    """

    url_prefix = settings.PORTAL_PUBLICATION_DATACITE_URL_PREFIX or ""
    parsed = urlsplit(url_prefix)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return request.build_absolute_uri("/").rstrip("/")


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


def _get_distribution(base_meta, project_id, request):
    """Build the Croissant/schema.org `distribution` list (one cr:FileObject per published file)
    from the publication's file_objs, pointing at the existing public, unauthenticated Tapis
    download route for the published project system.
    """

    published_system_id = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{project_id}"
    # Resolved once and reused for every file below -- see _get_configured_origin's docstring
    # for why this can't just be request.build_absolute_uri.
    origin = _get_configured_origin(request)

    distribution = []
    for file_obj in base_meta.get("fileObjs", []):
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue

        # Percent-encoded once and reused for both `@id` and `contentUrl` below. `@id` is a
        # JSON-LD identifier that (per the Croissant spec's own examples) doubles as an IRI
        # reference resolved against this document's own URL -- leaving it as the raw path
        # while `contentUrl` already percent-encodes the same path would let the two diverge,
        # and would make `@id` an invalid IRI for any path containing characters (spaces, etc.)
        # that aren't legal unescaped in one.
        encoded_path = quote(path)
        content_url = f"{origin}/api/datafiles/tapis/download/projects/{published_system_id}/{encoded_path}/"
        file_object = {
            "@type": "cr:FileObject",
            "@id": encoded_path,
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


def _get_cover_image_url(base_meta, request):
    """Build an absolute download URL for the publication's cover image, for og:image/
    twitter:image (link-unfurl preview cards in Slack/Discord/LinkedIn/X/iMessage).

    Deliberately doesn't reuse _get_distribution's published_system_id (the per-project
    `{PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{project_id}` system): the cover image isn't
    transferred there. project_publish_operations.py's _transfer_cover_image copies it onto
    PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME instead -- a single shared root system, at the
    same relative path stored in `coverImage` -- so the download URL has to point there. Same
    public, unauthenticated Tapis download route otherwise (datafiles/urls.py's
    tapis/<operation>/<scheme>/<system>/<path> takes any system id, not just per-project
    ones), and the same _get_configured_origin used for every other file URL in this module,
    so this can't end up on a different host than `url`/`distribution` either.
    """

    cover_image_path = (base_meta.get("coverImage") or "").lstrip("/")
    root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    if not cover_image_path or not root_system:
        return None

    origin = _get_configured_origin(request)
    return f"{origin}/api/datafiles/tapis/download/projects/{root_system}/{quote(cover_image_path)}/"


def _get_record_sets(base_meta):
    """Build the Croissant `recordSet` list (one cr:RecordSet per tabular file that has known
    columns) from the publication's file_objs. This only ever reads metadata already stored
    on `fileObjs` (the `columns` field, populated at publish time for recognized tabular
    formats) -- it does no file I/O of its own, since this runs on every page request. Files
    with no known columns are simply skipped, so a publication with no extracted schemas yet
    degrades to no `recordSet` at all rather than a broken one.
    """

    record_sets = []
    for file_obj in base_meta.get("fileObjs", []):
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
    download/...` route (used for Croissant's `distribution`/`contentUrl`, which carries no such
    requirement) can. See PublicationFileDownloadView's docstring for why that distinction
    matters -- this is only meant for citation_pdf_url.

    `path` must be the file's raw (not percent-encoded) path: reverse() percent-encodes its own
    kwargs, so passing an already-quote()'d path here would double-encode it.
    """

    url_path = reverse("publications:file_download", kwargs={"project_id": project_id, "path": path})
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


def _get_citation_pdf_url(base_meta, project_id, request):
    """Pick the first PDF out of the publication's fileObjs, for Google Scholar's
    citation_pdf_url.

    Deliberately doesn't reuse `distribution`'s own `contentUrl` the way this used to -- Scholar
    (unlike Croissant, which has no such rule) requires citation_pdf_url to resolve in the same
    subdirectory as the citing landing page, which `distribution`'s generic `/api/datafiles/
    tapis/download/...` download links don't guarantee (see _get_configured_origin's docstring).
    _get_publication_file_url's `file_download` route does, so this re-walks fileObjs (the same
    way _get_distribution does) to build that URL instead. `distribution`/`contentUrl` is left
    alone since Croissant doesn't need this.
    """

    for file_obj in base_meta.get("fileObjs", []):
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue
        encoding_format, _ = mimetypes.guess_type(name)
        if encoding_format == "application/pdf":
            return _get_publication_file_url(project_id, path, request)
    return None


class PublicationFileDownloadView(View):
    """Serve one published file at a URL nested under its publication's own landing-page path
    (public_data/urls.py's `file_download` pattern), rather than the datafiles app's generic
    `/api/datafiles/tapis/download/...` route -- so citation_pdf_url (built against this view via
    _get_publication_file_url) can satisfy Google Scholar's requirement that citation_pdf_url
    resolve in the same subdirectory as the citing landing page (see _get_configured_origin's
    docstring), which the generic download route can't since it lives under a wholly separate
    path tree from wherever a given deployment's landing page is served.

    Just translates project_id into the published system id TapisFilesView expects and delegates
    straight to it -- TapisFilesView already streams unauthenticated files off `public`-prefixed
    Tapis systems (datafiles/views.py's PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX check), which is
    exactly what a published project's system is, so there's no auth/streaming logic to
    duplicate here.
    """

    def get(self, request, project_id, path):
        system = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{project_id}"
        return TapisFilesView.as_view()(request, operation="download", scheme="projects", system=system, path=path)


def get_schema_org_json(pub, project_id, request):
    """Build a schema.org/Dataset JSON-LD object for a published project to embed directly in
    the page's <script type="application/ld+json"> tag for Google Dataset Search.
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
        # Distinct from `citeAs` above -- see _get_citations' docstring. Optional/recommended
        # per Google's own Dataset structured-data guidance, not Croissant-required, so an empty
        # list here is fine and gets dropped by the empty-field cleanup below like `keywords`.
        "citation": _get_citations(base_meta),
        "license": _get_license(base_meta, project_id),
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

    # `url` (and `identifier`, when there's no DOI to use instead) used to fall back to
    # PORTAL_PUBLICATION_DATACITE_URL_PREFIX directly, which could silently degrade to a
    # technically-absolute-but-meaningless URL when that setting was unset/blank -- not
    # something the empty-value check above would catch. _get_landing_page_url now always
    # reverses public_data/urls.py's own `index` route instead (see its docstring), which can't
    # produce that kind of meaningless value: it's either a real, working landing-page URL, or
    # reverse() raises NoReverseMatch outright. So there's nothing left for this function to
    # separately guard against here.

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
    # `keywords` (base_metadata.py) is typed `str | list[str] | None` -- the DPMP form stores it
    # as a single free-text, comma-separated string, not a list, so joining unconditionally
    # would join its individual characters instead of leaving it alone. Only join when it's
    # actually a list; pass a string straight through.
    kw = base_meta.get("keywords") or ""
    citation_meta["keywords"] = ", ".join(kw) if isinstance(kw, list) else kw
    # Page-level (not per-entity, like `keywords` above) since og:image/twitter:image are
    # single tags in <head>, not part of the citation_* block.
    citation_meta["cover_image_url"] = _get_cover_image_url(base_meta, request)
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
            "pdf_url": _get_citation_pdf_url(base_meta, pub.project_id, request),
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
    """

    def get(self, request, *args, **kwargs):
        # Mirrors the is_published filter publications/views.py already uses for its own
        # (authenticated) publications listing.
        publications = Publication.objects.filter(is_published=True).order_by("project_id")

        entries = []
        for pub in publications:
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
