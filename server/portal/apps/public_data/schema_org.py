"""A publication's landing-page metadata: its schema.org Dataset / Croissant JSON-LD
(get_schema_org_json), and the Dublin Core and Google Scholar tags built alongside it
(get_citation_context).
"""

import copy
import json
import logging
import mimetypes
from urllib.parse import quote

from django.conf import settings
from django.urls import reverse

from portal.apps.projects.schema_models.doi import doi_url, normalize_doi
from portal.apps.projects.schema_models.keywords import normalize_keywords
from portal.apps.projects.schema_models.license_urls import resolve_license_url
from portal.apps.projects.schema_models.orcid import orcid_url
from portal.apps.public_data.citations import (
    format_citation_author,
    format_citation_date,
    get_apa_citation,
    get_bibtex_citation,
    get_citation_pdf_url,
    get_citations,
)
from portal.apps.public_data.links import (
    get_catalog_url,
    get_cover_image_url,
    get_croissant_url,
    get_landing_page_url,
    get_publication_file_url,
    get_publication_origin,
)
from portal.apps.publications.utils import (
    get_archive_zip_path,
    get_landing_namespace,
    get_publication_file_objs,
    get_published_workspace_id,
)

logger = logging.getLogger(__name__)

# The only properties Google Dataset Search hard-requires on a schema.org/Dataset. These are
# the only fields whose absence makes get_schema_org_json raise -- which leaves the landing
# page noindex with no JSON-LD and out of the sitemap -- since without them there's no valid
# Dataset to emit at all.
REQUIRED_DATASET_FIELDS = ("name", "description")

# Google's Dataset structured-data guidelines require `description` to be 50-5000 characters
# (https://developers.google.com/search/docs/appearance/structured-data/dataset). Outside that
# range the Dataset is still emitted -- Search may just flag or ignore it -- so get_schema_org_json
# only logs a warning rather than raising.
GOOGLE_DATASET_DESCRIPTION_LENGTH = (50, 5000)

# Properties Croissant (http://mlcommons.org/croissant/1.1) additionally requires on a
# conformant Dataset. When any of these is missing, get_schema_org_json still emits the plain
# schema.org Dataset -- it's still valid, and still eligible for Dataset Search -- but drops
# the `conformsTo` claim rather than asserting Croissant conformance it doesn't have.
# `url`/`identifier` are also Croissant-required, but always present: they come from
# get_landing_page_url, which can't return an empty value (see the comment in
# get_schema_org_json).
REQUIRED_CROISSANT_FIELDS = ("license", "creator", "datePublished", "distribution")

# Croissant also requires a content checksum on every cr:FileObject in `distribution` -- either of
# these properties satisfies it (mlcroissant: "At least one of these properties should be defined:
# ['md5', 'sha256']"). A Dataset with any unhashed file is emitted without `conformsTo` too.
CROISSANT_FILE_CHECKSUM_FIELDS = ("md5", "sha256")

CROISSANT_1_1 = "http://mlcommons.org/croissant/1.1"

# PublicationCroissantView's media type: JSON-LD with the Croissant version's profile, per the spec.
CROISSANT_1_1_MEDIA_TYPE = f'application/ld+json; profile="{CROISSANT_1_1}"'

# The Croissant 1.1 spec's JSON-LD @context (Appendix 1), in full, except that schema.org is
# https://schema.org/ rather than the spec's http://schema.org/: mlcroissant rejects a Dataset whose
# @vocab doesn't resolve to https://schema.org/Dataset. Every Croissant term this document emits --
# in `distribution` (cr:FileObject, cr:FileSet and its `containedIn`) or `recordSet` (cr:RecordSet,
# field/source/extract/fileObject/dataType/column) -- needs its mapping here, or it falls back to
# the bare @vocab and resolves to a nonexistent "https://schema.org/<term>".
CROISSANT_1_1_CONTEXT = {
    "@language": "en",
    "@vocab": "https://schema.org/",
    "sc": "https://schema.org/",
    "cr": "http://mlcommons.org/croissant/",
    "rai": "http://mlcommons.org/croissant/RAI/",
    "dct": "http://purl.org/dc/terms/",
    "annotation": "cr:annotation",
    "arrayShape": "cr:arrayShape",
    "citeAs": "cr:citeAs",
    "column": "cr:column",
    "conformsTo": "dct:conformsTo",
    "containedIn": "cr:containedIn",
    "data": {"@id": "cr:data", "@type": "@json"},
    "dataType": {"@id": "cr:dataType", "@type": "@vocab"},
    "equivalentProperty": "cr:equivalentProperty",
    "examples": {"@id": "cr:examples", "@type": "@json"},
    "excludes": "cr:excludes",
    "extract": "cr:extract",
    "field": "cr:field",
    "fileProperty": "cr:fileProperty",
    "fileObject": "cr:fileObject",
    "fileSet": "cr:fileSet",
    "format": "cr:format",
    "includes": "cr:includes",
    "isArray": "cr:isArray",
    "isLiveDataset": "cr:isLiveDataset",
    "jsonPath": "cr:jsonPath",
    "key": "cr:key",
    "md5": "cr:md5",
    "parentField": "cr:parentField",
    "recordSet": "cr:recordSet",
    "references": "cr:references",
    "regex": "cr:regex",
    "readLines": "cr:readLines",
    "sdVersion": "cr:sdVersion",
    "separator": "cr:separator",
    "source": "cr:source",
    "subField": "cr:subField",
    "transform": "cr:transform",
    "unArchive": "cr:unArchive",
    "value": "cr:value",
}

# The only formats Croissant defines `extract.column` for (as mimetypes.guess_type names them), so
# the only files _get_record_sets builds a recordSet for.
CROISSANT_TABULAR_FORMATS = ("text/csv", "text/tab-separated-values")

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


class SchemaOrgValidationError(Exception):
    """Raised when a publication's metadata can't satisfy the schema.org/Croissant fields
    get_schema_org_json claims to emit."""


def _get_license(base_meta, project_id):
    """Resolve the publication's stored license selection to its canonical license-deed URL.

    schema.org/Croissant require `license` to be a URL (or CreativeWork), not a bare label.
    A stored value that's already a URL is passed through as-is; otherwise it must have a
    mapping (projects/schema_models/license_urls.py, or PORTAL_PUBLICATION_LICENSE_URLS).
    Silently falling back to the raw label for an unmapped value would ship a non-conformant
    `license` and regress silently every time a new option is added to the form's `select`
    without a matching mapping -- so this raises instead, the same way every other
    required-but-malformed field here does.
    """

    license_value = base_meta.get("license")
    if not license_value:
        return license_value
    resolved = resolve_license_url(license_value)
    if resolved is None:
        raise SchemaOrgValidationError(
            f"Publication {project_id} has license {license_value!r}, which has no license-deed "
            "URL (projects/schema_models/license_urls.py or PORTAL_PUBLICATION_LICENSE_URLS) and "
            "isn't itself a URL. schema.org/Croissant require `license` to be a URL, not free "
            f"text -- add a URL for {license_value!r} to PORTAL_PUBLICATION_LICENSE_URLS."
        )
    return resolved


def _get_orcid_same_as(author):
    """Resolve an author's `orcid_id` (set by get_project_user from the user's profile, or by
    the publish form's AddOrcidModal) to its canonical https://orcid.org/ URL, for that
    creator's `sameAs`, or None if it has no valid ORCID. Normalized by projects/
    schema_models/orcid.py, the same function datacite_operations.get_datacite_json uses for
    `nameIdentifiers`, so both always agree.

    Unlike `license` (a REQUIRED_CROISSANT_FIELDS entry), a malformed ORCID isn't worth failing
    the whole page's JSON-LD over: it's just left out.
    """

    return orcid_url(author.get("orcid_id"))


def _format_content_size(num_bytes):
    """Format a byte count as Croissant/schema.org's `contentSize` expects -- schema.org's own
    docs describe the property as "File size in (mega/kilo)bytes", and both its and Croissant's
    published examples use a scaled, human-readable unit (e.g. "18MB"), not a raw byte count.
    A bare "<n> B" value is technically valid Text but unreadable at real file sizes, so this
    scales to the largest unit that keeps the mantissa under 1000. Units are decimal (SI: 1 KB
    = 1000 bytes), so the KB/MB labels mean what they say rather than KiB/MiB.
    """

    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1000 or unit == "TB":
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1000


# Every cr:FileObject in `distribution` is also typed schema.org DataDownload (see _get_distribution).
# The Croissant type must come first: mlcroissant reads only the first entry of a list-valued
# `@type`, so ["DataDownload", "cr:FileObject"] would no longer load as a FileObject.
_FILE_OBJECT_TYPES = ("cr:FileObject", "DataDownload")


def _has_type(entry, type_name):
    """Whether a JSON-LD node's `@type` -- a single type, or a list of them -- includes
    `type_name`."""

    types = entry.get("@type")
    return type_name in (types if isinstance(types, list) else [types])


def _get_archive_file_object(pub, request):
    """Build the `distribution` entry for the current version's whole-publication ZIP, or return
    None when it can't be listed: no sha256 stored for it yet (Croissant requires one on every
    cr:FileObject; archive app 0.0.3+ writes it -- see load_publication_file_checksums), or no web
    mirror for PublicationArchiveView to redirect to.

    Typed both cr:FileObject and schema.org DataDownload, like every other `distribution` entry, so
    Google's Dataset structured data -- which describes `distribution` as DataDownloads -- sees it.
    """

    if not pub.archive_sha256 or not settings.PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL:
        return None
    url_path = reverse(f"{get_landing_namespace()}:archive", kwargs={"project_id": pub.project_id})
    url = f"{get_publication_origin(request)}{url_path}"
    archive = {
        "@type": list(_FILE_OBJECT_TYPES),
        "@id": url,
        "name": get_archive_zip_path(get_published_workspace_id(pub.project_id, pub.version)).rsplit("/", 1)[-1],
        "contentUrl": url,
        "encodingFormat": "application/zip",
    }
    if pub.archive_size is not None:
        archive["contentSize"] = _format_content_size(pub.archive_size)
    archive["sha256"] = pub.archive_sha256
    return archive


def _get_distribution(file_objs, project_id, request, archive=None, archive_root=None, file_sets=False):
    """Build the Croissant/schema.org `distribution` list (one cr:FileObject per published file and,
    with `file_sets`, one cr:FileSet per published directory) from `file_objs` -- get_unique_publication_file_objs'
    combined list, so files attached to entity nodes are listed alongside root-level ones, and
    every file listed here is one the
    PublicationFileDownloadView allow-list serves. Each `contentUrl` points at that view, which
    returns the file's own bytes -- Croissant consumers (and Google Dataset Search) fetch
    `contentUrl` expecting the file itself, not the datafiles app's generic download route, which
    returns a JSON envelope around a short-lived Tapis postit link for the SPA to follow.

    Every cr:FileObject is also typed schema.org DataDownload (_FILE_OBJECT_TYPES). Croissant lists
    FileObjects in `distribution` where schema.org expects DataDownloads, so Google's Rich Results
    Test and validator.schema.org flag an entry without that type as an invalid object type
    (mlcommons/croissant#725). mlcroissant still reads a dual-typed entry as its Croissant type.

    With `archive` (_get_archive_file_object's entry for the whole-publication ZIP), that entry is
    listed last. Directories are only listed with both `archive` and `file_sets`, each as a
    cr:FileSet `containedIn` the ZIP rather than having its contents enumerated, which would mean
    a Tapis listing call on every page render. Its `includes` matches the directory under
    `archive_root`, the ZIP's top-level folder (the published workspace id). Otherwise directories
    are left out: Croissant can't expand a glob over HTTP, and the ZIP already covers their files.

    `file_sets` is for the standalone Croissant document (PublicationCroissantView) only. The
    landing page's JSON-LD, which Google reads, leaves directories out: Google requires a
    `contentUrl` on every DataDownload, and the only one a directory has is the whole ZIP, which
    would list the same download again under each directory's name.
    """

    distribution = []
    for file_obj in file_objs:
        file_type = file_obj.get("type")
        if file_type not in ("file", "dir"):
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").strip("/")
        if not name or not path:
            continue

        content_url = get_publication_file_url(project_id, path, request)
        if content_url is None:
            continue
        if file_type == "dir":
            if archive and file_sets:
                distribution.append(_get_file_set(name, content_url, archive["@id"], f"{archive_root}/{path}"))
            continue
        file_object = {
            "@type": list(_FILE_OBJECT_TYPES),
            # The file's own absolute URL, not its relative path: a relative `@id` resolves against
            # the page's `<base href="/">` (base.html), not the landing page, so "data.csv" in two
            # different publications would name the same node. contentUrl is already absolute,
            # percent-encoded by reverse() and unique to this publication's file.
            "@id": content_url,
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

    if archive:
        distribution.append(archive)
    return distribution


def _get_file_set(name, dir_url, archive_url, archive_dir):
    """Build the cr:FileSet for one published directory at `dir_url` (its get_publication_file_url),
    `containedIn` the whole-publication ZIP at `archive_url` and `includes` everything under
    `archive_dir`, the directory's path inside the ZIP.

    Typed cr:FileSet only, with no `contentUrl`: Croissant defines neither for a FileSet, whose
    bytes come from what it's `containedIn`. FileSets only appear in the standalone Croissant
    document, not the landing page's JSON-LD that Google reads (see _get_distribution).

    `containedIn` is `cr:containedIn` in the 1.1 `@context`. Without that mapping mlcroissant
    1.1 silently drops the link to the ZIP.

    The trailing "/" keeps the `@id` distinct from a cr:FileObject `@id`, which never ends in
    one. Croissant requires `encodingFormat` on a FileSet too, but a directory's contents can be
    any mix of formats and nothing stored says which, so it gets the same generic fallback a
    FileObject with an unrecognized extension does. FileSets carry no checksum: Croissant only
    requires one on a cr:FileObject.
    """

    return {
        "@type": "cr:FileSet",
        "@id": f"{dir_url}/",
        "name": name,
        "encodingFormat": "application/octet-stream",
        "containedIn": {"@id": archive_url},
        "includes": f"{archive_dir}/**",
    }


def _get_record_sets(file_objs, project_id, request):
    """Build the Croissant `recordSet` list (one cr:RecordSet per CSV/TSV file that has known
    columns) from `file_objs` -- the same combined list `distribution` is built from, so every
    recordSet's `source.fileObject` resolves to a `distribution` entry. This only ever reads
    metadata already stored on `fileObjs` (the `columns` field) -- it does no file I/O of its
    own, since this runs on every page request. Nothing populates `columns` yet (see
    FileColumn), so today this returns [] and the Dataset is emitted with no `recordSet` --
    which Croissant allows; it isn't one of REQUIRED_CROISSANT_FIELDS.
    """

    record_sets = []
    for file_obj in file_objs:
        columns = file_obj.get("columns")
        path = (file_obj.get("path") or "").lstrip("/")
        if not columns or not path:
            continue

        # Croissant only defines column extraction for CSV/TSV. Any other format would advertise a
        # recordSet no consumer can actually read records from.
        encoding_format, _ = mimetypes.guess_type(file_obj.get("name") or path)
        if encoding_format not in CROISSANT_TABULAR_FORMATS:
            continue

        named_columns = [column for column in columns if column.get("name")]
        column_names = [column["name"] for column in named_columns]
        # Duplicate headers would give two fields the same @id (Croissant requires @ids to be
        # unique) and make `extract.column` ambiguous, so the whole recordSet is withheld.
        if len(column_names) != len(set(column_names)):
            logger.warning(
                f"Publication {project_id} file {path} has duplicate column names, so it's emitted without a recordSet."
            )
            continue

        # The same absolute URL _get_distribution uses as this file's cr:FileObject "@id" (see its
        # comment), so `source.fileObject.@id` below cross-references the matching `distribution`
        # entry. A file with no URL has no `distribution` entry to reference, so no recordSet.
        file_url = get_publication_file_url(project_id, path, request)
        if file_url is None:
            continue
        # "#records" can't collide with any other @id in the document: reverse() and quote() both
        # encode a literal "#" in a path or column name as %23, so no cr:FileObject @id (or field
        # suffix) ever contains a raw "#" (whereas "{url}/records" would collide with the field for
        # a column named "records"). Fields are prefixed with their recordSet's @id, per the spec;
        # safe="" also encodes "/" in a column name, so a field suffix is always one segment.
        record_set_id = f"{file_url}#records"
        record_sets.append(
            {
                "@type": "cr:RecordSet",
                "@id": record_set_id,
                "name": file_obj.get("name"),
                "field": [
                    {
                        "@type": "cr:Field",
                        "@id": f"{record_set_id}/{quote(column['name'], safe='')}",
                        "name": column["name"],
                        "dataType": column.get("dataType", "sc:Text"),
                        "source": {
                            # Links back to the matching entry this same publication's
                            # `distribution` emits in _get_distribution, whose "@id" is
                            # also the file's URL.
                            "fileObject": {"@id": file_url},
                            "extract": {"column": column["name"]},
                        },
                    }
                    for column in named_columns
                ],
            }
        )

    return record_sets


def get_unique_publication_file_objs(pub):
    """Every file object associated anywhere in the publication, deduplicated by path.

    Files are associated with whichever project-graph node their folder belongs to
    (libs/agave/operations.py's upload: an entity's own `fileObjs` when the folder is an entity,
    the project root's otherwise), and publish_project's _add_values_to_tree copies each entity's
    value into its node in `Publication.tree`. So `pub.value["fileObjs"]` alone only covers files
    attached directly to the project root -- the entity nodes in `pub.tree` hold the rest
    (publications/utils.py's get_publication_file_objs reads both).
    """

    by_path = {}
    for file_obj in get_publication_file_objs(pub):
        path = (file_obj.get("path") or "").strip("/")
        if path:
            by_path.setdefault(path, file_obj)
    return list(by_path.values())


def get_schema_org_json(pub, project_id, request, file_objs=None, file_sets=False):
    """Build a schema.org/Dataset JSON-LD object for a published project to embed directly in
    the page's <script type="application/ld+json"> tag for Google Dataset Search.

    `file_objs` is get_unique_publication_file_objs(pub), for a caller that already has it.
    `file_sets` also lists published directories as cr:FileSets, for the standalone Croissant
    document (see _get_distribution). It never changes whether `conformsTo` is claimed: FileSets
    are only listed alongside the ZIP, which is listed either way.
    """

    base_meta = pub.value
    doi = base_meta.get("doi")
    # Root-level and entity-node files together -- see get_unique_publication_file_objs.
    if file_objs is None:
        file_objs = get_unique_publication_file_objs(pub)

    # A metadata-only / externally-hosted publication can legitimately have no files at all, and
    # so is never a Croissant candidate. Having files that failed to make it into `distribution`
    # (missing name/path on every fileObj) is a data bug instead -- worth a warning below.
    has_files = any(file_obj.get("type") in ("file", "dir") for file_obj in file_objs)
    archive = _get_archive_file_object(pub, request) if has_files else None
    # Directories are only listed inside the ZIP (see _get_distribution), so a directory-only
    # publication without one has nothing to list either -- not a data bug.
    lists_files = archive is not None or any(file_obj.get("type") == "file" for file_obj in file_objs)

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
        given_name = (author.get("first_name") or "").strip()
        family_name = (author.get("last_name") or "").strip()
        name = f"{given_name} {family_name}".strip()
        # A Person with an empty name is invalid schema.org, so a nameless author is left out.
        if not name:
            logger.warning(f"Publication {project_id} has an author with no name; leaving them out of `creator`.")
            continue
        creator = {"@type": "Person", "name": name}
        # The separate name parts, as DataCite's `creators` sends them (datacite_operations.py),
        # so a consumer doesn't have to guess where `name` splits. Each is left out when empty.
        if given_name:
            creator["givenName"] = given_name
        if family_name:
            creator["familyName"] = family_name
        # Only the author's own institution: the publication-level `institution` says where the
        # dataset is hosted, not where each of its authors works.
        institution = (author.get("institution") or "").strip()
        if institution:
            creator["affiliation"] = {"@type": "Organization", "name": institution}
        same_as = _get_orcid_same_as(author)
        if same_as:
            creator["sameAs"] = same_as
        creators.append(creator)

    landing_page_url = get_landing_page_url(project_id, pub.version, request)
    schema_org_json = {
        "@context": copy.deepcopy(CROISSANT_1_1_CONTEXT),
        "@type": "Dataset",
        # Names the Dataset node itself, so it isn't a blank node other documents can't refer to.
        # The landing page, not the DOI: `identifier`/`sameAs` already carry the DOI, and every
        # other `@id` in this document is a URL on this same origin.
        "@id": landing_page_url,
        "name": base_meta.get("title"),
        # Provisional -- removed below unless every REQUIRED_CROISSANT_FIELDS entry made it into
        # the final document. Set here only to keep its position in the serialized output.
        "conformsTo": CROISSANT_1_1,
        "description": base_meta.get("description"),
        "citeAs": get_bibtex_citation(base_meta, doi, project_id, pub.version, request),
        # Distinct from `citeAs` above -- see get_citations' docstring. Optional/recommended
        # per Google's own Dataset structured-data guidance, not Croissant-required, so an empty
        # list here is fine and gets dropped by the empty-field cleanup below like `keywords`.
        "citation": get_citations(base_meta),
        "license": license_url,
        # Every publication this view serves is published to the public, unauthenticated Tapis
        # download route built in _get_distribution -- there's no embargo/access-tier concept in
        # the publish workflow, so this is unconditionally true rather than sourced from
        # base_meta. Revisit if/when a restricted-access publication type is introduced.
        "isAccessibleForFree": True,
        "url": landing_page_url,
        "identifier": doi_url(doi) or landing_page_url,
        # Recommended by both schema.org/Croissant -- a canonical URL for this exact dataset's
        # identity, distinct from `url` (the landing *page*, which could theoretically move).
        # Only worth stating when there's a real DOI to point at: with no DOI, `identifier`
        # already falls back to this same landing-page `url` above, and sameAs===url would be a
        # vacuous "same as itself" claim rather than a second, independent identity URL. Dropped
        # by the empty-field cleanup below when doi is falsy, like `keywords`/`citation`.
        "sameAs": doi_url(doi),
        "creator": creators,
        # Google's Dataset guidance recommends a `url` on Organizations. The publisher is this
        # portal, so it's the site root on the same origin as the landing page.
        "publisher": {
            "@type": "Organization",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
            "url": f"{get_publication_origin(request)}/",
        },
        # Trimmed list, the same one DataCite's `subjects` gets (projects/schema_models/keywords.py).
        "keywords": normalize_keywords(base_meta.get("keywords")),
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
        # (e.g. a link to v2, visited after a v3 republish) is 301'd to v3's URL and renders v3's
        # content throughout, so claiming the URL's version number would contradict every other
        # field in this same document. pub.version is the only value
        # that's ever consistent with the content actually being rendered. A string, matching
        # DataCite's `version` (datacite_operations.py) -- schema.org allows Text there, and a bare
        # "2" satisfies Croissant's MAJOR[.MINOR[.PATCH]] pattern as-is.
        "version": str(pub.version),
        "includedInDataCatalog": {
            "@type": "DataCatalog",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
            "url": get_catalog_url(request),
        },
        "distribution": _get_distribution(
            file_objs,
            project_id,
            request,
            archive=archive,
            archive_root=get_published_workspace_id(project_id, pub.version),
            file_sets=file_sets,
        ),
        "recordSet": _get_record_sets(file_objs, project_id, request),
    }

    # Drop empty/unset fields so the JSON-LD stays clean
    schema_org_json = {k: v for k, v in schema_org_json.items() if v not in (None, [], "")}

    missing = [field for field in REQUIRED_DATASET_FIELDS if field not in schema_org_json]
    if missing:
        fix_hints = {"name": "the publication's title", "description": "the publication's description"}
        raise SchemaOrgValidationError(
            f"Publication {project_id} is missing required schema.org Dataset field(s) "
            f"{', '.join(missing)}; its published Dataset metadata is incomplete. Fix the "
            f"publication's metadata (check {', '.join(fix_hints[field] for field in missing)}) "
            "before this page can be indexed."
        )

    min_length, max_length = GOOGLE_DATASET_DESCRIPTION_LENGTH
    description_length = len(schema_org_json["description"])
    if not min_length <= description_length <= max_length:
        logger.warning(
            f"Publication {project_id} has a {description_length}-character description; Google Dataset "
            f"Search expects {min_length}-{max_length} characters, so it may flag or ignore this Dataset."
        )

    # Only claim Croissant conformance when every field Croissant requires actually made it in.
    # Otherwise this is still a valid plain schema.org Dataset, so it's emitted without the claim.
    croissant_missing = [field for field in REQUIRED_CROISSANT_FIELDS if field not in schema_org_json]
    if croissant_missing:
        del schema_org_json["conformsTo"]
        # A fileless publication was never a Croissant candidate, so there's nothing to report.
        if lists_files:
            logger.warning(
                f"Publication {project_id} has files but is missing Croissant-required field(s) "
                f"{', '.join(croissant_missing)}, so its Dataset is emitted without conformsTo "
                f"{CROISSANT_1_1}."
            )
    # Every cr:FileObject also needs a checksum, or Croissant validators reject the whole Dataset.
    # Not logged: publications archived before the archive app wrote sha256 manifests (app < 0.0.3)
    # have no hashes until compute_publication_checksums backfills them, so a warning would fire for
    # every one of them on every page render and sitemap build.
    elif any(
        _has_type(file_object, "cr:FileObject")
        and not any(file_object.get(field) for field in CROISSANT_FILE_CHECKSUM_FIELDS)
        for file_object in schema_org_json["distribution"]
    ):
        del schema_org_json["conformsTo"]

    return schema_org_json


def get_citation_context(pub, request):
    """Get Dublin Core and Google Scholar (citation_*) metadata, plus the schema.org JSON-LD
    payload, for a published project's page <head>. The citation_* tags follow the Highwire
    Press convention Google Scholar's indexing guide documents
    (https://scholar.google.com/intl/en/scholar/inclusion.html#indexing).
    """

    file_objs = get_unique_publication_file_objs(pub)
    # Built first so its already-resolved `url` and `distribution` (with real, absolute
    # download URLs) can be reused below instead of recomputed.
    schema_org_json = get_schema_org_json(pub, pub.project_id, request, file_objs)

    base_meta = pub.value
    authors = base_meta.get("authors", [])
    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date")

    citation_meta = {}
    # Stored as either a comma-separated string or a list; normalized to the same trimmed list as
    # the JSON-LD `keywords` and DataCite's `subjects` (projects/schema_models/keywords.py).
    citation_meta["keywords"] = ", ".join(normalize_keywords(base_meta.get("keywords")))
    # Page-level (not per-entity, like `keywords` above) since og:image/twitter:image are
    # single tags in <head>, not part of the citation_* block.
    citation_meta["cover_image_url"] = get_cover_image_url(base_meta, pub.project_id, request)
    # Linked only when the document claims Croissant conformance -- PublicationCroissantView
    # 404s otherwise, so the page never links a Croissant loader to something it would reject.
    if "conformsTo" in schema_org_json:
        citation_meta["croissant_url"] = get_croissant_url(pub.project_id, request)
    citation_meta["entities"] = [
        {
            "title": base_meta.get("title"),
            "description": base_meta.get("description"),
            # Bare, for citation_doi, which Google Scholar expects without a "doi:" label or resolver.
            "doi": normalize_doi(base_meta.get("doi")),
            # For the visible summary's DOI link (index.html's `content` block).
            "doi_url": doi_url(base_meta.get("doi")),
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
                    f"{author.get('first_name') or ''} {author.get('last_name') or ''}".strip() for author in authors
                )
                if name
            ],
            # One "Last, First" string per author -- the template emits one <meta
            # name="citation_author"> tag per entry, as Scholar's guide asks for.
            "citation_authors": [name for name in (format_citation_author(author) for author in authors) if name],
            "publication_date": publication_date,
            "citation_date": format_citation_date(publication_date),
            "pdf_url": get_citation_pdf_url(file_objs, pub.project_id, request),
            "abstract_url": schema_org_json.get("url"),
            # For the visible summary: a readable APA citation, and the same BibTeX entry the
            # JSON-LD gives as `citeAs`.
            "apa_citation": get_apa_citation(base_meta, base_meta.get("doi"), pub.project_id, pub.version, request),
            "bibtex_citation": schema_org_json.get("citeAs"),
        }
    ]

    pub_title = base_meta["title"]
    return citation_meta, schema_org_json, pub_title


def dumps_json_ld(schema_org_json):
    """Serialize a JSON-LD payload for safe embedding in a `<script>` tag."""

    return json.dumps(schema_org_json).translate(_JSON_LD_HTML_ESCAPES)
