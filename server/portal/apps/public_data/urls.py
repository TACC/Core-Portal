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
    # Nested under the same path `index` above matches, so a file served from
    # here is always in the same subdirectory as the landing page that links to
    # it -- see PublicationFileDownloadView's docstring for why that matters
    # (Google Scholar's citation_pdf_url same-subdirectory requirement). Must
    # come before the `index_fallback` catch-all below, which would otherwise
    # swallow this pattern first. `path` is [\s\S]+, not .+: `.` never matches a newline,
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
    re_path(r"^.*$", IndexView.as_view(), name="index_fallback"),
]
