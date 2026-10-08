"""
.. module:: portal.apps.site_search.urls
    :synopsis: Site Search URLs
"""

import re

from django.conf import settings
from django.urls import re_path

from portal.apps.public_data.views import (
    IndexView,
    PublicationCoverImageView,
    PublicationCroissantView,
    PublicationFileDownloadView,
    PublicationSubpathNotFoundView,
)

app_name = "public_data"

published_prefix = re.escape(settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX or "")
id_prefix = re.escape(settings.PORTAL_PROJECTS_ID_PREFIX or "")

urlpatterns = [
    # The `vN` group is non-capturing so reverse() can build the versioned form
    # (publications/utils.py's get_landing_page_path); Django can't reverse a
    # capturing group that wraps a named one.
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)(?:v(?P<revision>[0-9]+))?/?$",
        IndexView.as_view(),
        name="index",
    ),
    # Always under the bare project id, whatever version the landing page is:
    # nested under version 1's `index` path, and beside a republish's `...vN`
    # path. Either way a file is in the same directory as the landing page that
    # links to it, which Google Scholar requires of citation_pdf_url -- see
    # PublicationFileDownloadView's docstring. Must come before the
    # `index_fallback` catch-all below, which would otherwise swallow this
    # pattern first. `path` is [\s\S]+, not .+: `.` never matches a newline,
    # which is legal in a filename -- with .+, reverse() raised for a name with a newline
    # inside it (failing the landing page's whole JSON-LD), and URLs for a name ending in one
    # reversed fine but never resolved.
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)/files/(?P<path>[\s\S]+)$",
        PublicationFileDownloadView.as_view(),
        name="file_download",
    ),
    # og:image/twitter:image for the landing page above. Also before `index_fallback`.
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)/cover-image$",
        PublicationCoverImageView.as_view(),
        name="cover_image",
    ),
    # The landing page's JSON-LD as a standalone document, for Croissant loaders that fetch a
    # dataset by URL rather than scraping it out of HTML. Also before `index_fallback`.
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)/croissant\.json$",
        PublicationCroissantView.as_view(),
        name="croissant",
    ),
    # The DPMP client's entity pages (PublishedDatasetsRoutes.jsx's
    # `:system/:entity_type/:entity_id`): `entity_type` is the last part of the entity's schema
    # name ("sample") and `entity_id` the UUID ending its graph node id (NODE_<name>_<uuid>).
    # Served the client app like `index_fallback`, so with no named groups: a `project_id` kwarg
    # would make IndexView treat it as the landing page and redirect it there.
    re_path(
        rf"^{published_prefix}\.{id_prefix}-[0-9]+(?:v[0-9]+)?/[A-Za-z0-9_]+/[0-9A-Fa-f-]{{36}}/?$",
        IndexView.as_view(),
        name="entity_fallback",
    ),
    # Any other path under a project id (for example `...vN/croissant.json`, or `...vN/files/...`,
    # which only exist under the bare id) is a real 404, not the client app at 200 -- a soft 404
    # that crawlers would otherwise treat as a duplicate page. Must come after every route above
    # and before `index_fallback`.
    re_path(
        rf"^{published_prefix}\.{id_prefix}-[0-9]+(?:v[0-9]+)?/",
        PublicationSubpathNotFoundView.as_view(),
        name="subpath_not_found",
    ),
    re_path(r"^.*$", IndexView.as_view(), name="index_fallback"),
]
