"""Absolute URLs for a publication's landing page and for the files, cover image, Croissant
document and catalog page it links to.

Shared by the landing page's JSON-LD (schema_org.py), its citation tags (citations.py), the sitemap
(sitemap.py) and the views, and all built on one origin (get_publication_origin), so none of them
can point at a different host than the others.
"""

import logging

from django.conf import settings
from django.urls import NoReverseMatch, reverse

from portal.apps.public_data.origin import get_configured_origin
from portal.apps.publications.utils import get_landing_namespace, get_landing_page_path

logger = logging.getLogger(__name__)


def get_publication_origin(request):
    """Return the "scheme://host" that file/distribution URLs should be built against, so they
    can never end up on a different domain than the one `get_landing_page_url` resolves `url`/
    `identifier`/`citeAs` against.

    PORTAL_PUBLICATION_DATACITE_URL_PREFIX, when configured as an absolute URL, can point at a
    different host than the one that served this request (e.g. the public domain in front of an
    internal one). Building distribution/contentUrl from request.build_absolute_uri instead would
    put the dataset's `url` and its file download links on two different domains, which is
    inconsistent for Croissant. Falls back to the current request's own scheme+host when the
    prefix is unset or isn't itself an absolute URL.

    This only guarantees the two land on the same *host* -- it says nothing about path. Google
    Scholar's stricter requirement that citation_pdf_url live in the same subdirectory as the
    citing landing page is handled separately, by building every published-file URL through
    `get_publication_file_url` -- see its docstring.
    """

    return get_configured_origin() or request.build_absolute_uri("/").rstrip("/")


def get_cover_image_url(base_meta, project_id, request):
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

    url_path = reverse(f"{get_landing_namespace()}:cover_image", kwargs={"project_id": project_id})
    return f"{get_publication_origin(request)}{url_path}"


def get_catalog_url(request):
    """Absolute URL of the published-datasets browse page -- the root of the same `published-datasets/`
    mount the landing pages live under, where the client app lists every publication -- for the
    JSON-LD `includedInDataCatalog.url`. Reversed from public_data/urls.py's `index_fallback`
    catch-all, the route that serves that page, on the same origin as every other URL here.
    """

    return f"{get_publication_origin(request)}{reverse(f'{get_landing_namespace()}:index_fallback')}"


def get_landing_page_url(project_id, version, request):
    """Build the landing-page URL for the publication's current `version`, guaranteed absolute.

    The path comes from reversing public_data/urls.py's own `index` pattern (under
    get_landing_namespace()'s mount, `published-datasets/` for DPMP) -- the one Django route that
    renders this page's JSON-LD/citation meta tags, via IndexView -- so it can't drift from that
    route. PORTAL_PUBLICATION_DATACITE_URL_PREFIX isn't used for the path: it's unset or "" in
    some deployments and points elsewhere in others.

    Only the origin is deployment-configurable, via get_publication_origin -- see its docstring.

    A republish's URL carries its `vN` suffix -- see get_landing_page_path for why.
    """

    return f"{get_publication_origin(request)}{get_landing_page_path(project_id, version)}"


def get_publication_file_url(project_id, path, request):
    """Build the URL for one published file, via public_data/urls.py's `file_download` pattern:
    `<published-datasets mount>/<prefix>.<project id>/files/<path>`. It always uses the bare
    project id, whatever version the landing page is, so it's nested under version 1's landing
    page path and sits beside a republish's `...vN` one. Either way the file is in the same
    directory as the landing page, which Scholar requires of citation_pdf_url -- unlike the
    datafiles app's generic `/api/datafiles/tapis/download/...` route. Used for both
    citation_pdf_url and Croissant's `distribution`/`contentUrl`, so a crawler following either one
    gets the file's own bytes -- see PublicationFileDownloadView's docstring. The URL doesn't name
    a version: after a republish, the same URL serves the new version's file.

    `path` must be the file's raw (not percent-encoded) path: reverse() percent-encodes its own
    kwargs, so passing an already-quote()'d path here would double-encode it.

    Returns None (and logs) if the route can't express `path`, and callers skip that one file:
    a NoReverseMatch escaping from here would fail the whole page's JSON-LD -- leaving the
    landing page noindex and out of the sitemap -- over a single file. The route accepts any
    character (see public_data/urls.py), so this is a guard against future pattern changes.
    """

    try:
        url_path = reverse(f"{get_landing_namespace()}:file_download", kwargs={"project_id": project_id, "path": path})
    except NoReverseMatch:
        logger.warning(f"Publication {project_id}: no file_download URL for {path!r}; omitting that file.")
        return None
    return f"{get_publication_origin(request)}{url_path}"


def get_croissant_url(project_id, request):
    """Absolute URL of the publication's standalone JSON-LD document (public_data/urls.py's
    `croissant` pattern), on the same origin as every other URL here. The landing page links to it
    with <link rel="alternate">.
    """

    url_path = reverse(f"{get_landing_namespace()}:croissant", kwargs={"project_id": project_id})
    return f"{get_publication_origin(request)}{url_path}"
