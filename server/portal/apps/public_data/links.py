"""Absolute URLs for a publication's landing page and for the files, cover image, Croissant
document and catalog page it links to.

Shared by the landing page's JSON-LD (schema_org.py), its citation tags (citations.py), the sitemap
(sitemap.py) and the views, and all built on one origin (_get_configured_origin), so none of them
can point at a different host than the others.
"""

import logging

from django.conf import settings
from django.urls import NoReverseMatch, reverse

from portal.apps.public_data.origin import get_configured_origin
from portal.apps.publications.utils import get_landing_page_path

logger = logging.getLogger(__name__)


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
        url_path = reverse("publications:file_download", kwargs={"project_id": project_id, "path": path})
    except NoReverseMatch:
        logger.warning(f"Publication {project_id}: no file_download URL for {path!r}; omitting that file.")
        return None
    return f"{_get_configured_origin(request)}{url_path}"


def _get_croissant_url(project_id, request):
    """Absolute URL of the publication's standalone JSON-LD document (public_data/urls.py's
    `croissant` pattern), on the same origin as every other URL here. The landing page links to it
    with <link rel="alternate">.
    """

    return f"{_get_configured_origin(request)}{reverse('publications:croissant', kwargs={'project_id': project_id})}"
