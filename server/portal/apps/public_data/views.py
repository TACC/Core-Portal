import copy
import json
import logging
import mimetypes
import posixpath
import re
import unicodedata
from urllib.parse import quote, urlsplit

import requests
from django.conf import settings
from django.core.cache import cache
from django.http import (
    Http404,
    HttpResponse,
    HttpResponsePermanentRedirect,
    HttpResponseRedirect,
    StreamingHttpResponse,
)
from django.urls import NoReverseMatch, reverse
from django.utils.html import escape
from django.utils.http import content_disposition_header
from django.views.generic.base import TemplateView, View

from portal.apps.projects.schema_models.doi import doi_url
from portal.apps.projects.schema_models.keywords import normalize_keywords
from portal.apps.projects.schema_models.license_urls import resolve_license_url
from portal.apps.projects.schema_models.orcid import orcid_url
from portal.apps.public_data.origin import get_configured_origin
from portal.apps.publications.models import Publication
from portal.apps.publications.utils import (
    get_landing_page_path,
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

# The Croissant 1.0 spec's official @context, verbatim and in full (the same one mlcroissant's
# make_context builds for a 1.0 document, and its example datasets use). Every Croissant term this
# document emits -- in `distribution` (cr:FileObject) or `recordSet` (cr:RecordSet, field/source/
# extract/fileObject/dataType/column) -- needs its mapping here, or it falls back to the bare @vocab
# and resolves to a nonexistent "https://schema.org/<term>". The terms this document doesn't use
# are kept too: mlcroissant warns that any @context missing one of them "is not standard".
CROISSANT_1_0_CONTEXT = {
    "@language": "en",
    "@vocab": "https://schema.org/",
    "citeAs": "cr:citeAs",
    "column": "cr:column",
    "conformsTo": "dct:conformsTo",
    "cr": "http://mlcommons.org/croissant/",
    "rai": "http://mlcommons.org/croissant/RAI/",
    "data": {"@id": "cr:data", "@type": "@json"},
    "dataType": {"@id": "cr:dataType", "@type": "@vocab"},
    "dct": "http://purl.org/dc/terms/",
    "equivalentProperty": "cr:equivalentProperty",
    "examples": {"@id": "cr:examples", "@type": "@json"},
    "extract": "cr:extract",
    "field": "cr:field",
    "fileProperty": "cr:fileProperty",
    "fileObject": "cr:fileObject",
    "fileSet": "cr:fileSet",
    "format": "cr:format",
    "includes": "cr:includes",
    "isLiveDataset": "cr:isLiveDataset",
    "jsonPath": "cr:jsonPath",
    "key": "cr:key",
    "md5": "cr:md5",
    "parentField": "cr:parentField",
    "path": "cr:path",
    "recordSet": "cr:recordSet",
    "references": "cr:references",
    "regex": "cr:regex",
    "repeated": "cr:repeated",
    "replace": "cr:replace",
    "samplingRate": "cr:samplingRate",
    "sc": "https://schema.org/",
    "separator": "cr:separator",
    "source": "cr:source",
    "subField": "cr:subField",
    "transform": "cr:transform",
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

# Characters that are special to (La)TeX inside a BibTeX field value, and how to write each one
# literally, so a title like "Pores & 50% porosity" can't break the entry or the document citing it.
_BIBTEX_ESCAPES = str.maketrans(
    {
        "\\": r"\textbackslash{}",
        "{": r"\{",
        "}": r"\}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
)

# Published files are relayed to the client in chunks of this size rather than buffered whole
# (tapipy's files.getContents returns the entire file as one bytes object), since a published
# dataset's files can run to multiple GB.
_FILE_STREAM_CHUNK_SIZE = 64 * 1024

# SitemapView rebuilds every publication's JSON-LD to decide what to list, so its entries are
# cached for this long. A publish or withdrawal shows up in the sitemap within this window.
_SITEMAP_CACHE_SECONDS = 5 * 60

# The sitemap protocol's limit on URLs in one sitemap file (and on sitemaps in one index). Past it,
# SitemapView serves a sitemap index pointing at numbered sitemap files of up to this many URLs each.
SITEMAP_MAX_URLS = 50_000

_SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


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
    """Resolve an author's `orcid_id` (set by get_project_user from the user's profile, or by
    the publish form's AddOrcidModal) to its canonical https://orcid.org/ URL, for that
    creator's `sameAs`, or None if it has no valid ORCID. Normalized by projects/
    schema_models/orcid.py, the same function datacite_operations.get_datacite_json uses for
    `nameIdentifiers`, so both always agree.

    Unlike `license` (a REQUIRED_CROISSANT_FIELDS entry), a malformed ORCID isn't worth failing
    the whole page's JSON-LD over: it's just left out.
    """

    return orcid_url(author.get("orcid_id"))


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
    scales to the largest unit that keeps the mantissa under 1000. Units are decimal (SI: 1 KB
    = 1000 bytes), so the KB/MB labels mean what they say rather than KiB/MiB.
    """

    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if size < 1000 or unit == "TB":
            return f"{int(size)} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1000


def _get_distribution(file_objs, project_id, request):
    """Build the Croissant/schema.org `distribution` list (one cr:FileObject per published file,
    one cr:FileSet per published directory) from `file_objs` -- _get_publication_file_objs'
    combined list, so files attached to entity nodes are listed alongside root-level ones, and
    every file listed here is one the
    PublicationFileDownloadView allow-list serves. Each `contentUrl` points at that view, which
    returns the file's own bytes -- Croissant consumers (and Google Dataset Search) fetch
    `contentUrl` expecting the file itself, not the datafiles app's generic download route, which
    returns a JSON envelope around a short-lived Tapis postit link for the SPA to follow.

    A directory file object becomes a cr:FileSet rather than having its contents enumerated:
    listing them would mean a Tapis listing call on every page render. Its `includes` glob
    matches everything under the directory's URL on the same route, which the allow-list
    serves (see _is_publication_file_path).
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

        content_url = _get_publication_file_url(project_id, path, request)
        if content_url is None:
            continue
        if file_type == "dir":
            distribution.append(_get_file_set(name, content_url))
            continue
        file_object = {
            "@type": "cr:FileObject",
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

    return distribution


def _get_file_set(name, dir_url):
    """Build the cr:FileSet for one published directory at `dir_url` (its _get_publication_file_url).

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
        "includes": f"{dir_url}/**",
    }


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
        file_url = _get_publication_file_url(project_id, path, request)
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


def _get_catalog_url(request):
    """Absolute URL of the published-datasets browse page -- the root of the same `published-datasets/`
    mount the landing pages live under, where the client app lists every publication -- for the
    JSON-LD `includedInDataCatalog.url`. Reversed from public_data/urls.py's `index_fallback`
    catch-all, the route that serves that page, on the same origin as every other URL here.
    """

    return f"{_get_configured_origin(request)}{reverse('publications:index_fallback')}"


def _get_landing_page_url(project_id, version, request):
    """Build the landing-page URL for the publication's current `version`, guaranteed absolute.

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

    A republish's URL carries its `vN` suffix -- see get_landing_page_path for why.
    """

    return f"{_get_configured_origin(request)}{get_landing_page_path(project_id, version)}"


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


def _format_apa_author(author):
    """Format one author as "Family, G." -- the APA form DataCite's own citation formatter uses --
    with an initial for each given name, keeping hyphens ("Jean-Paul" -> "J.-P.")."""

    initials = [
        "-".join(f"{part[0]}." for part in name.split("-") if part) for name in (author.get("first_name") or "").split()
    ]
    initials = " ".join(initial for initial in initials if initial)
    return f"{author['last_name'].strip()}, {initials}" if initials else author["last_name"].strip()


def _end_sentence(text):
    """`text` ending in exactly one sentence-ending mark, so a title or name that already ends in
    one doesn't get a second period."""

    return text if text.endswith((".", "?", "!")) else f"{text}."


def _get_apa_citation(base_meta, doi, project_id, version, request):
    """Build a plain-text citation for the landing page's visible summary, following DataCite's
    recommended citation format (Creator(s) (PublicationYear). Title. Publisher. Identifier),
    in the APA style DataCite's own citation formatter produces -- e.g. "Lovelace, A., & Turing, A.
    (2024). Title. Publisher. https://doi.org/..." -- from metadata already available on the
    publication so it can't go stale like a hand-written placeholder would. Authors without a last
    name are left out.
    """

    author_names = [
        _format_apa_author(author) for author in base_meta.get("authors", []) if (author.get("last_name") or "").strip()
    ]
    if len(author_names) > 1:
        author_names = [f"{', '.join(author_names[:-1])}, & {author_names[-1]}"]

    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    year = publication_date[:4] if publication_date else ""

    identifier = f"https://doi.org/{doi}" if doi else _get_landing_page_url(project_id, version, request)

    creator_and_year = " ".join([*author_names, *([f"({year})"] if year else [])])
    sentences = [creator_and_year, base_meta.get("title"), settings.PORTAL_PUBLICATION_PUBLISHER]
    # The identifier is a URL, so it isn't followed by a period.
    return " ".join([*(_end_sentence(part.strip()) for part in sentences if part and part.strip()), identifier])


def _bibtex_value(text):
    """`text` as one BibTeX field value: whitespace (including newlines) collapsed, and TeX's
    special characters escaped (_BIBTEX_ESCAPES)."""

    return " ".join(str(text).split()).translate(_BIBTEX_ESCAPES)


def _bibtex_verbatim(text):
    """`text` (a DOI or URL) as a verbatim BibTeX field, which biblatex and the url package read as
    is -- so nothing is escaped, but braces and backslashes, which would still end the field early,
    are dropped. Neither appears in a real DOI or in the URLs built here."""

    return re.sub(r"[{}\\\s]", "", text)


def _get_bibtex_key(base_meta, project_id):
    """A citation key in the usual "lastnameYEAR" form ("lovelace2024"), from the first author with
    a last name, reduced to ASCII letters and digits since BibTeX keys can't hold spaces, commas or
    braces. Falls back to the project id ("DRP7"), which every publication has."""

    last_names = [
        (author.get("last_name") or "").strip()
        for author in base_meta.get("authors", [])
        if (author.get("last_name") or "").strip()
    ]
    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    if last_names:
        ascii_name = unicodedata.normalize("NFKD", last_names[0]).encode("ascii", "ignore").decode()
        key = re.sub(r"[^A-Za-z0-9]", "", ascii_name).lower() + re.sub(r"[^0-9]", "", publication_date[:4])
        if key and key[0].isalpha():
            return key
    return re.sub(r"[^A-Za-z0-9]", "", project_id)


def _get_bibtex_citation(base_meta, doi, project_id, version, request):
    """Build a BibTeX entry for the Croissant `citeAs` property, whose spec asks for BibTeX
    ("Ideally, citations should be expressed using the bibtex format"). It's an @misc entry, the
    type DataCite's own BibTeX export uses for a dataset, with the same parts as the APA citation
    (_get_apa_citation): authors as "Family, Given" joined by "and" (those without a last name are
    left out, as in the APA form), title, publisher, year, and the DOI, or the landing page's URL
    when there's no DOI. Missing parts are left out.
    """

    authors = [
        _bibtex_value(_format_citation_author(author))
        for author in base_meta.get("authors", [])
        if (author.get("last_name") or "").strip()
    ]
    publication_date = base_meta.get("publicationDate") or base_meta.get("publication_date") or ""
    fields = [
        ("author", " and ".join(authors)),
        ("title", _bibtex_value(base_meta.get("title") or "")),
        ("publisher", _bibtex_value(settings.PORTAL_PUBLICATION_PUBLISHER or "")),
        ("year", re.sub(r"[^0-9]", "", publication_date[:4])),
        ("doi", _bibtex_verbatim(doi) if doi else ""),
        ("url", _bibtex_verbatim(doi_url(doi) if doi else _get_landing_page_url(project_id, version, request))),
    ]
    body = ",\n".join(f"  {name} = {{{value}}}" for name, value in fields if value)
    return f"@misc{{{_get_bibtex_key(base_meta, project_id)},\n{body}\n}}"


def _get_citations(base_meta):
    """Build the schema.org `citation` list -- CreativeWork entries for academic articles the
    data provider recommends citing in addition to the dataset itself
    (https://developers.google.com/search/docs/appearance/structured-data/dataset) -- from the
    publication's `relatedPublications` entries. This is a distinct property from Croissant's
    own `citeAs` (built by _get_bibtex_citation above): `citeAs` says how to cite *this* dataset,
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

        # Google's Dataset guidelines expect `author` to be a Person or Organization, not a bare
        # string. The form only collects one free-text name with no type, so Person is assumed.
        author = r_data.get("publicationAuthor")

        citation = {
            "@type": "CreativeWork",
            "name": title,
            "author": {"@type": "Person", "name": author} if author else None,
            "datePublished": r_data.get("publicationDateOfPublication"),
            "url": r_data.get("publicationLink"),
            # Prefer the DOI (a stabler, more citable identifier than a plain link) when one's
            # given -- same "https://doi.org/<doi>" form used for the dataset's own `identifier`
            # elsewhere in this module. Normalized first (projects/schema_models/doi.py), since the
            # form accepts a bare DOI, "doi:..." or a resolver URL; anything else is left out.
            "identifier": doi_url(r_data.get("publicationDoi")),
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
    """The publication's PDF for Google Scholar's citation_pdf_url, only when it has exactly one.

    `file_objs` is _get_publication_file_objs' combined list, so a PDF attached to an entity node
    counts too. citation_pdf_url claims the PDF is the article's full text, and nothing in the
    metadata says which file that is. With several PDFs (papers, reports, supplements) any pick
    could be wrong, so none is emitted; with one, it's the only candidate.

    Scholar requires citation_pdf_url to resolve in the same subdirectory as the citing landing
    page, which _get_publication_file_url's `file_download` route guarantees -- the same route
    `distribution`/`contentUrl` is built against, so the two always agree. That route serves PDFs
    from the portal host itself even when a web mirror is configured (PublicationFileDownloadView).
    """

    pdf_paths = []
    for file_obj in file_objs:
        if file_obj.get("type") != "file":
            continue
        name = file_obj.get("name")
        path = (file_obj.get("path") or "").lstrip("/")
        if not name or not path:
            continue
        encoding_format, _ = mimetypes.guess_type(name)
        if encoding_format == "application/pdf":
            pdf_paths.append(path)

    if len(pdf_paths) != 1:
        return None
    return _get_publication_file_url(project_id, pdf_paths[0], request)


def _get_croissant_url(project_id, request):
    """Absolute URL of the publication's standalone JSON-LD document (public_data/urls.py's
    `croissant` pattern), on the same origin as every other URL here. The landing page links to it
    with <link rel="alternate">.
    """

    return f"{_get_configured_origin(request)}{reverse('publications:croissant', kwargs={'project_id': project_id})}"


def get_schema_org_json(pub, project_id, request, file_objs=None):
    """Build a schema.org/Dataset JSON-LD object for a published project to embed directly in
    the page's <script type="application/ld+json"> tag for Google Dataset Search.

    `file_objs` is _get_publication_file_objs(pub), for a caller that already has it.
    """

    base_meta = pub.value
    doi = base_meta.get("doi")
    # Root-level and entity-node files together -- see _get_publication_file_objs.
    if file_objs is None:
        file_objs = _get_publication_file_objs(pub)

    # A metadata-only / externally-hosted publication can legitimately have no files at all, and
    # so is never a Croissant candidate. Having files that failed to make it into `distribution`
    # (missing name/path on every fileObj) is a data bug instead -- worth a warning below.
    has_files = any(file_obj.get("type") in ("file", "dir") for file_obj in file_objs)

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

    landing_page_url = _get_landing_page_url(project_id, pub.version, request)
    schema_org_json = {
        "@context": copy.deepcopy(CROISSANT_1_0_CONTEXT),
        "@type": "Dataset",
        # Names the Dataset node itself, so it isn't a blank node other documents can't refer to.
        # The landing page, not the DOI: `identifier`/`sameAs` already carry the DOI, and every
        # other `@id` in this document is a URL on this same origin.
        "@id": landing_page_url,
        "name": base_meta.get("title"),
        # Provisional -- removed below unless every REQUIRED_CROISSANT_FIELDS entry made it into
        # the final document. Set here only to keep its position in the serialized output.
        "conformsTo": CROISSANT_1_0,
        "description": base_meta.get("description"),
        "citeAs": _get_bibtex_citation(base_meta, doi, project_id, pub.version, request),
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
        "url": landing_page_url,
        "identifier": f"https://doi.org/{doi}" if doi else landing_page_url,
        # Recommended by both schema.org/Croissant -- a canonical URL for this exact dataset's
        # identity, distinct from `url` (the landing *page*, which could theoretically move).
        # Only worth stating when there's a real DOI to point at: with no DOI, `identifier`
        # already falls back to this same landing-page `url` above, and sameAs===url would be a
        # vacuous "same as itself" claim rather than a second, independent identity URL. Dropped
        # by the empty-field cleanup below when doi is falsy, like `keywords`/`citation`.
        "sameAs": f"https://doi.org/{doi}" if doi else None,
        "creator": creators,
        # Google's Dataset guidance recommends a `url` on Organizations. The publisher is this
        # portal, so it's the site root on the same origin as the landing page.
        "publisher": {
            "@type": "Organization",
            "name": settings.PORTAL_PUBLICATION_PUBLISHER,
            "url": f"{_get_configured_origin(request)}/",
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
            "url": _get_catalog_url(request),
        },
        "distribution": _get_distribution(file_objs, project_id, request),
        "recordSet": _get_record_sets(file_objs, project_id, request),
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
        if has_files:
            logger.warning(
                f"Publication {project_id} has files but is missing Croissant-required field(s) "
                f"{', '.join(croissant_missing)}, so its Dataset is emitted without conformsTo "
                f"{CROISSANT_1_0}."
            )
    # Every cr:FileObject also needs a checksum, or Croissant validators reject the whole Dataset.
    # Logged at debug, not warning: publications archived before the archive app wrote sha256
    # manifests (app < 0.0.3) have no hashes until compute_publication_checksums backfills them, so
    # until then this fires for every one of them on every page render and sitemap build. Raise it
    # to a warning once the backfill has run, when an unhashed file is a real anomaly.
    elif unhashed := [
        file_object["@id"]
        for file_object in schema_org_json["distribution"]
        if file_object["@type"] == "cr:FileObject"
        and not any(file_object.get(field) for field in CROISSANT_FILE_CHECKSUM_FIELDS)
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

    file_objs = _get_publication_file_objs(pub)
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
    citation_meta["cover_image_url"] = _get_cover_image_url(base_meta, pub.project_id, request)
    # Linked only when the document claims Croissant conformance -- PublicationCroissantView
    # 404s otherwise, so the page never links a Croissant loader to something it would reject.
    if "conformsTo" in schema_org_json:
        citation_meta["croissant_url"] = _get_croissant_url(pub.project_id, request)
    citation_meta["entities"] = [
        {
            "title": base_meta.get("title"),
            "description": base_meta.get("description"),
            "doi": base_meta.get("doi"),
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
            "citation_authors": [name for name in (_format_citation_author(author) for author in authors) if name],
            "publication_date": publication_date,
            "citation_date": _format_citation_date(publication_date),
            "pdf_url": _get_citation_pdf_url(file_objs, pub.project_id, request),
            "abstract_url": schema_org_json.get("url"),
            # For the visible summary: a readable APA citation, and the same BibTeX entry the
            # JSON-LD gives as `citeAs`.
            "apa_citation": _get_apa_citation(base_meta, base_meta.get("doi"), pub.project_id, pub.version, request),
            "bibtex_citation": schema_org_json.get("citeAs"),
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
                if not pub.is_published:
                    # A withdrawn publication's DOI still resolves here (DataCite expects a
                    # tombstone page, not a 404), so the page still renders -- but with no
                    # citation/JSON-LD metadata, which also leaves it at base.html's default
                    # noindex. Matches SitemapView, which leaves it out for the same reason.
                    logger.info(f"Publication {project_id} is unpublished; serving it without metadata.")
                elif not pub.is_indexable:
                    # Mid first publish: the files are still being transferred, or the DOI isn't
                    # findable yet, so the page's file links and DOI wouldn't resolve. Served the same way
                    # until publish_publication_doi (project_publish_operations.py) marks it
                    # indexable; SitemapView leaves it out meanwhile.
                    logger.info(f"Publication {project_id} isn't indexable yet; serving it without metadata.")
                else:
                    # `revision` (the URL's `vN` suffix -- see public_data/urls.py) can't select a
                    # specific version's content: Publication is keyed by bare project_id and always
                    # holds only the latest republish (see get_schema_org_json's `version` comment).
                    # A mismatch means this link was minted against an older version that's since
                    # been superseded; get() 301s it to the current version's URL -- worth knowing
                    # about even though there's no old content left to serve.
                    revision = kwargs.get("revision")
                    if revision is not None and int(revision) != pub.version:
                        logger.warning(
                            f"Publication {project_id} was requested at revision {revision}, but "
                            f"its current version is {pub.version}; redirecting to the current version."
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

    def get(self, request, *args, **kwargs):
        context = self.get_context_data(**kwargs)
        canonical_url = context.get("canonical_url")
        if canonical_url:
            # The landing page also answers at its trailing-slash form, at any other version's
            # bare or `vN` form, and under the /public-data/ mount (portal/urls.py). Send those to
            # the canonical path -- the current version's (see get_landing_page_path) -- with a 301
            # so crawlers consolidate on one URL instead of seeing 200 duplicates. Only the path is
            # changed: the host stays the request's own (see _get_configured_origin for why the
            # canonical host can differ from the one serving this request).
            canonical_path = urlsplit(canonical_url).path
            if request.path != canonical_path:
                query = request.META.get("QUERY_STRING")
                return HttpResponsePermanentRedirect(f"{canonical_path}?{query}" if query else canonical_path)
        return self.render_to_response(context)

    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)


def _get_publication_file_objs(pub):
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


def _get_published_system_id(project_id, version):
    """Return the Tapis system a publication's current version was published to. Must match
    publish_project (project_publish_operations.py): version 1 publishes to
    `{prefix}.{project_id}`, every republish to its own `{prefix}.{project_id}v{version}` system.
    Publication.version is the version publish_project last wrote, so this always points at the
    files the landing page's metadata describes -- not version 1's.
    """

    return f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{get_published_workspace_id(project_id, version)}"


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

    PDFs are always relayed, never redirected: citation_pdf_url points at a PDF, and Scholar
    requires it in the landing page's own subdirectory without saying whether it follows a
    redirect to another host. Relaying keeps the PDF's bytes on the portal host. Publication PDFs
    are papers, not multi-GB data, so holding a uWSGI worker for one is acceptable.

    Only serves paths the publication itself declares (_is_publication_file_path), checked
    before any redirect or Tapis call: without the check this route would relay (with the
    service account's token) or point at any path on the published system -- including files
    never associated with the publication -- and send every crawler-guessed URL onward. An
    unpublished (withdrawn) publication serves no files at all.
    """

    def get(self, request, project_id, path):
        pub = Publication.objects.filter(project_id=project_id, is_published=True).first()
        if pub is None:
            raise Http404(f"No publication found for project {project_id}")
        if not _is_publication_file_path(pub, path):
            raise Http404(f"Publication {project_id} has no file at {path}")
        content_type, _ = mimetypes.guess_type(posixpath.basename(path))
        if content_type != "application/pdf":
            web_url = _get_published_web_url(f"{get_published_workspace_id(project_id, pub.version)}/{path}")
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
    PublicationFileDownloadView does -- the root system's rootDir is the mirror's root. An
    unpublished (withdrawn) publication has no cover image here.
    """

    def get(self, request, project_id):
        root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
        pub = Publication.objects.filter(project_id=project_id, is_published=True).first()
        cover_image_path = ((pub.value.get("coverImage") if pub else None) or "").lstrip("/")
        if not root_system or not cover_image_path:
            raise Http404(f"No cover image for publication {project_id}")
        web_url = _get_published_web_url(cover_image_path)
        if web_url:
            return HttpResponseRedirect(web_url)
        return _stream_published_file(root_system, cover_image_path)


class PublicationCroissantView(View):
    """Serve a publication's schema.org/Croissant JSON-LD -- the same document its landing page
    embeds -- on its own, as application/ld+json. Croissant tooling (mlcroissant, dataset loaders)
    loads a dataset from a URL that returns the JSON-LD itself, not an HTML page with it inside a
    <script> tag.

    Served only for publications whose landing page carries the JSON-LD (published and indexable,
    with metadata that builds -- as for IndexView and SitemapView) and whose JSON-LD claims
    Croissant conformance (`conformsTo`; see get_schema_org_json for what withholds it, e.g. a
    file without a checksum). Anything else 404s, and the landing page only links here when it's
    served. Any origin may fetch it, since it describes a public dataset and browser-based dataset
    tools load it cross-origin.
    """

    def get(self, request, project_id):
        pub = Publication.objects.filter(project_id=project_id, is_published=True, is_indexable=True).first()
        if pub is None:
            raise Http404(f"No published dataset for project {project_id}")
        try:
            schema_org_json = get_schema_org_json(pub, project_id, request)
        except Exception as e:
            logger.exception(f"Failed to build the Croissant JSON-LD for project {project_id}: {e}")
            raise Http404(f"No Croissant metadata for project {project_id}") from e
        if "conformsTo" not in schema_org_json:
            raise Http404(f"Publication {project_id}'s metadata doesn't conform to Croissant")
        response = HttpResponse(json.dumps(schema_org_json), content_type="application/ld+json")
        response["Access-Control-Allow-Origin"] = "*"
        return response


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

    Up to SITEMAP_MAX_URLS publications, /published-datasets/sitemap.xml is one <urlset> listing
    them all. Past that (the protocol's per-file limit), it becomes a <sitemapindex> pointing at
    numbered sitemap files (/published-datasets/sitemap-1.xml, -2, ...), each a <urlset> of up to
    SITEMAP_MAX_URLS publications in project_id order. The entry point's URL stays the same either
    way, so robots.txt and Search Console never need to change. Every numbered file sits in the
    same directory as the landing pages it lists, as the protocol's same-path rule requires.

    The entries (not the rendered XML) are cached for _SITEMAP_CACHE_SECONDS, keyed by the origin
    their <loc>s are built against (which can be the request's own host), so the index and every
    numbered file are cut from the same list. The cache is skipped, not fatal, if it's unreachable
    or rejects the value (memcached's default 1 MB item limit is reached at roughly ten thousand
    publications, after which every request rebuilds the list).
    """

    def get(self, request, *args, page=None, **kwargs):
        entries = self._get_entries(request)
        page_count = max(1, -(-len(entries) // SITEMAP_MAX_URLS))
        if page is None:
            if page_count == 1:
                body = self._render_urlset(entries)
            else:
                body = self._render_index(request, entries, page_count)
        elif 1 <= page <= page_count:
            body = self._render_urlset(entries[(page - 1) * SITEMAP_MAX_URLS : page * SITEMAP_MAX_URLS])
        else:
            raise Http404(f"No sitemap page {page}; there are {page_count}.")
        return HttpResponse(body, content_type="application/xml")

    def _get_entries(self, request):
        cache_key = f"public_data:sitemap_entries:{_get_configured_origin(request)}"
        try:
            entries = cache.get(cache_key)
        except Exception:
            logger.warning("Sitemap cache read failed; building the sitemap uncached.", exc_info=True)
            entries = None
        if entries is None:
            entries = self._build_entries(request)
            try:
                cache.set(cache_key, entries, _SITEMAP_CACHE_SECONDS)
            except Exception:
                logger.warning("Sitemap cache write failed.", exc_info=True)
        return entries

    def _build_entries(self, request):
        """Every listed publication's (escaped <loc>, <lastmod>) pair, in project_id order."""

        # Mirrors the is_published filter publications/views.py already uses for its own
        # (authenticated) publications listing, plus is_indexable: IndexView serves a publication
        # that's still mid first publish without metadata (noindex), so it isn't listed either.
        publications = Publication.objects.filter(is_published=True, is_indexable=True).order_by("project_id")

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
            loc = escape(_get_landing_page_url(pub.project_id, pub.version, request))
            lastmod = (pub.last_updated or pub.created).date().isoformat()
            entries.append((loc, lastmod))
        return entries

    def _render_urlset(self, entries):
        urls = [
            f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n  </url>" for loc, lastmod in entries
        ]
        return self._render("urlset", urls)

    def _render_index(self, request, entries, page_count):
        """A <sitemapindex> with one <sitemap> per numbered file. Each <lastmod> is the newest
        <lastmod> in that file (ISO dates sort as strings), so a crawler only refetches the files
        that changed. More than SITEMAP_MAX_URLS files (2.5 billion publications) isn't handled.
        """

        origin = _get_configured_origin(request)
        sitemaps = []
        for page in range(1, page_count + 1):
            page_entries = entries[(page - 1) * SITEMAP_MAX_URLS : page * SITEMAP_MAX_URLS]
            loc = escape(f"{origin}{reverse('sitemap_page', kwargs={'page': page})}")
            lastmod = max(lastmod for _, lastmod in page_entries)
            sitemaps.append(f"  <sitemap>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n  </sitemap>")
        return self._render("sitemapindex", sitemaps)

    def _render(self, root_tag, children):
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<{root_tag} xmlns="{_SITEMAP_NAMESPACE}">\n'
            + "\n".join(children)
            + ("\n" if children else "")
            + f"</{root_tag}>\n"
        )
