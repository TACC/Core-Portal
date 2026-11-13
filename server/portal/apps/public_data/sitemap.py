"""The published-datasets XML sitemap (https://www.sitemaps.org/protocol.html) that SitemapView
(public_data/views.py) serves: which publications it lists, and the <urlset>/<sitemapindex>
documents that list them.
"""

import logging

from django.http import Http404
from django.urls import reverse
from django.utils.html import escape

from portal.apps.public_data.links import get_landing_page_url, get_publication_origin
from portal.apps.public_data.schema_org import get_citation_context
from portal.apps.publications.models import Publication

logger = logging.getLogger(__name__)

# SitemapView rebuilds every publication's JSON-LD to decide what to list, so its entries are
# cached for this long. A publish or withdrawal shows up in the sitemap within this window.
SITEMAP_CACHE_SECONDS = 5 * 60

# The sitemap protocol's limit on URLs in one sitemap file (and on sitemaps in one index). Past it,
# SitemapView serves a sitemap index pointing at numbered sitemap files of up to this many URLs each.
SITEMAP_MAX_URLS = 50_000

_SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"


def build_sitemap_entries(request):
    """Every listed publication's (escaped <loc>, <lastmod>) pair, in project_id order.

    Only publications whose landing page will actually be indexable are listed: one whose
    get_citation_context fails renders as IndexView's generic noindex shell, so it's left out
    (and logged) -- see SitemapView's docstring.
    """

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
        loc = escape(get_landing_page_url(pub.project_id, pub.version, request))
        lastmod = (pub.last_updated or pub.created).date().isoformat()
        entries.append((loc, lastmod))
    return entries


def render_sitemap(request, entries, page=None):
    """The sitemap XML for `entries` (build_sitemap_entries' list): with no `page`, one <urlset>
    listing them all, or past SITEMAP_MAX_URLS a <sitemapindex> of numbered sitemap files; with a
    `page`, that numbered file's <urlset>. Raises Http404 for a page out of range, and for any page
    while there's no index to list them -- a sitemap-1.xml then would duplicate sitemap.xml.
    """

    page_count = max(1, -(-len(entries) // SITEMAP_MAX_URLS))
    if page is None:
        if page_count == 1:
            return _render_urlset(entries)
        return _render_index(request, entries, page_count)
    if page_count > 1 and 1 <= page <= page_count:
        return _render_urlset(entries[(page - 1) * SITEMAP_MAX_URLS : page * SITEMAP_MAX_URLS])
    raise Http404(f"No sitemap page {page}; there are {page_count}.")


def _render_urlset(entries):
    urls = [f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n  </url>" for loc, lastmod in entries]
    return _render("urlset", urls)


def _render_index(request, entries, page_count):
    """A <sitemapindex> with one <sitemap> per numbered file. Each <lastmod> is the newest
    <lastmod> in that file (ISO dates sort as strings), so a crawler only refetches the files
    that changed. More than SITEMAP_MAX_URLS files (2.5 billion publications) isn't handled.
    """

    origin = get_publication_origin(request)
    sitemaps = []
    for page in range(1, page_count + 1):
        page_entries = entries[(page - 1) * SITEMAP_MAX_URLS : page * SITEMAP_MAX_URLS]
        loc = escape(f"{origin}{reverse('sitemap_page', kwargs={'page': page})}")
        lastmod = max(lastmod for _, lastmod in page_entries)
        sitemaps.append(f"  <sitemap>\n    <loc>{loc}</loc>\n    <lastmod>{lastmod}</lastmod>\n  </sitemap>")
    return _render("sitemapindex", sitemaps)


def _render(root_tag, children):
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<{root_tag} xmlns="{_SITEMAP_NAMESPACE}">\n'
        + "\n".join(children)
        + ("\n" if children else "")
        + f"</{root_tag}>\n"
    )
