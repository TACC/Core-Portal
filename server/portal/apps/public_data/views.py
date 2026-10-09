import json
import logging
import mimetypes
import posixpath
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
from django.urls import reverse
from django.utils.http import content_disposition_header
from django.views.generic.base import TemplateView, View

from portal.apps.public_data.links import _get_configured_origin
from portal.apps.public_data.schema_org import (
    CROISSANT_1_1_MEDIA_TYPE,
    _get_publication_file_objs,
    dumps_json_ld,
    get_citation_context,
    get_schema_org_json,
)
from portal.apps.public_data.sitemap import SITEMAP_CACHE_SECONDS, build_sitemap_entries, render_sitemap
from portal.apps.publications.models import Publication
from portal.apps.publications.utils import (
    get_archive_zip_path,
    get_landing_namespace,
    get_published_workspace_id,
)

logger = logging.getLogger(__name__)

# Published files are relayed to the client in chunks of this size rather than buffered whole
# (tapipy's files.getContents returns the entire file as one bytes object), since a published
# dataset's files can run to multiple GB.
_FILE_STREAM_CHUNK_SIZE = 64 * 1024

# The only types a relayed file is displayed inline as. Anything else -- HTML, SVG, XML -- could
# run script on the portal's own origin, so it's sent as an application/octet-stream download.
_INLINE_FILE_CONTENT_TYPES = frozenset(
    {
        "application/pdf",
        "image/gif",
        "image/jpeg",
        "image/png",
        "image/webp",
        "text/csv",
        "text/plain",
        "text/tab-separated-values",
    }
)


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
                    # citation/JSON-LD metadata, and noindex. Matches SitemapView, which leaves it
                    # out for the same reason.
                    logger.info(f"Publication {project_id} is unpublished; serving it without metadata.")
                    context["noindex_publication"] = True
                elif not pub.is_indexable:
                    # Mid first publish: the files are still being transferred, or the DOI isn't
                    # findable yet, so the page's file links and DOI wouldn't resolve. Served the same way
                    # until publish_publication_doi (project_publish_operations.py) marks it
                    # indexable; SitemapView leaves it out meanwhile.
                    logger.info(f"Publication {project_id} isn't indexable yet; serving it without metadata.")
                    context["noindex_publication"] = True
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
    Publication.version only moves to a version once publish_project_callback has its files in
    place, so this always points at the files the landing page's metadata describes -- not
    version 1's.
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
    # A PDF or cover image renders in the browser/unfurler; any other type is downloaded instead.
    inline = content_type in _INLINE_FILE_CONTENT_TYPES
    response = StreamingHttpResponse(body(), content_type=content_type if inline else "application/octet-stream")
    response["Content-Disposition"] = content_disposition_header(not inline, file_name)
    # Published files are author-supplied, so none may run script as the portal. Not for PDFs:
    # browsers refuse to open a PDF in a sandboxed document, and its script runs in the viewer.
    if content_type != "application/pdf":
        response["Content-Security-Policy"] = "sandbox"
    if upstream.headers.get("Content-Length"):
        response["Content-Length"] = upstream.headers["Content-Length"]
    return response


class PublishedDatasetsMountMixin:
    """301 a publication's file, cover image, ZIP or Croissant route under the other mount of
    public_data/urls.py (portal/urls.py) to the same route under get_landing_namespace()'s, the one
    the landing page links to, so crawlers don't see 200 duplicates -- as IndexView.get does for
    the landing page itself. Keeps the query string.
    """

    def dispatch(self, request, *args, **kwargs):
        match = request.resolver_match
        namespace = get_landing_namespace()
        if match and match.namespace != namespace:
            path = reverse(f"{namespace}:{match.url_name}", kwargs=kwargs)
            query = request.META.get("QUERY_STRING")
            return HttpResponsePermanentRedirect(f"{path}?{query}" if query else path)
        return super().dispatch(request, *args, **kwargs)


class PublicationFileDownloadView(PublishedDatasetsMountMixin, View):
    """Serve one published file's bytes at a URL in the same directory as its publication's
    landing page (public_data/urls.py's `file_download` pattern, under the bare project id --
    see _get_publication_file_url), rather than the datafiles app's generic
    `/api/datafiles/tapis/download/...` route. Two reasons: Google Scholar requires citation_pdf_url
    to resolve in the same subdirectory as the citing landing page, and every consumer of
    citation_pdf_url/`contentUrl` expects the file itself -- see _stream_published_file's docstring
    for why the generic route can't provide that. It always serves the publication's current
    version's file.

    When PORTAL_PROJECTS_PUBLISHED_WEB_BASE_URL is configured, this redirects (302) to the file
    on that public web mirror (e.g. web.corral), which serves byte ranges and multi-GB files
    directly -- the URL in citation_pdf_url/`contentUrl` stays in the landing page's directory
    either way. Otherwise it falls back to relaying the bytes from Tapis.

    PDFs are always relayed, never redirected: citation_pdf_url points at a PDF, and Scholar
    requires it in the landing page's subdirectory without saying whether it follows a
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


class PublicationCoverImageView(PublishedDatasetsMountMixin, View):
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


class PublicationArchiveView(PublishedDatasetsMountMixin, View):
    """Redirect to the current version's whole-publication ZIP on the web mirror, for the landing
    page's `distribution` entry for it (_get_archive_file_object). The ZIPs can run to tens of GB,
    so they're never relayed through the portal: without a web mirror there's no ZIP here. Also
    404s for an unpublished (withdrawn) publication, and until the ZIP's sha256 is stored -- it's
    only written once the ZIP is complete, so a ZIP without one may be partial or missing.
    """

    def get(self, request, project_id):
        pub = Publication.objects.filter(project_id=project_id, is_published=True).first()
        web_url = (
            _get_published_web_url(get_archive_zip_path(get_published_workspace_id(project_id, pub.version)))
            if pub and pub.archive_sha256
            else None
        )
        if not web_url:
            raise Http404(f"No archive for publication {project_id}")
        return HttpResponseRedirect(web_url)


class PublicationCroissantView(PublishedDatasetsMountMixin, View):
    """Serve a publication's schema.org/Croissant JSON-LD -- the same document its landing page
    embeds -- on its own, as application/ld+json with the Croissant 1.1 profile. Croissant tooling
    (mlcroissant, dataset loaders) loads a dataset from a URL that returns the JSON-LD itself, not an
    HTML page with it inside a <script> tag.

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
        response = HttpResponse(json.dumps(schema_org_json), content_type=CROISSANT_1_1_MEDIA_TYPE)
        response["Access-Control-Allow-Origin"] = "*"
        return response


class PublicationSubpathNotFoundView(View):
    """404 for a path under a publication's id that no route serves (public_data/urls.py's
    `subpath_not_found`), rather than the client app's 200 shell from `index_fallback`."""

    def get(self, request, *args, **kwargs):
        raise Http404(f"Nothing is published at {request.path}")


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

    The entries (not the rendered XML) are cached for SITEMAP_CACHE_SECONDS, keyed by the origin
    their <loc>s are built against (which can be the request's own host), so the index and every
    numbered file are cut from the same list. The cache is skipped, not fatal, if it's unreachable
    or rejects the value (memcached's default 1 MB item limit is reached at roughly ten thousand
    publications, after which every request rebuilds the list).
    """

    def get(self, request, *args, page=None, **kwargs):
        entries = self._get_entries(request)
        if not entries:
            # The protocol's schema requires at least one <url>, so an empty <urlset/> is invalid;
            # with nothing to list, there's no sitemap.
            raise Http404("No published datasets to list.")
        return HttpResponse(render_sitemap(request, entries, page), content_type="application/xml")

    def _get_entries(self, request):
        cache_key = f"public_data:sitemap_entries:{_get_configured_origin(request)}"
        try:
            entries = cache.get(cache_key)
        except Exception:
            logger.warning("Sitemap cache read failed; building the sitemap uncached.", exc_info=True)
            entries = None
        if entries is None:
            entries = build_sitemap_entries(request)
            try:
                cache.set(cache_key, entries, SITEMAP_CACHE_SECONDS)
            except Exception:
                logger.warning("Sitemap cache write failed.", exc_info=True)
        return entries
