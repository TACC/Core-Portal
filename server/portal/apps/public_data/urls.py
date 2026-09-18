"""
.. module:: portal.apps.site_search.urls
    :synopsis: Site Search URLs
"""

import re

from django.conf import settings
from django.urls import re_path

from portal.apps.public_data.views import DataciteJsonPreviewView, IndexView, PublicationFileDownloadView

app_name = "public_data"

published_prefix = re.escape(settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX or "")
id_prefix = re.escape(settings.PORTAL_PROJECTS_ID_PREFIX or "")

urlpatterns = [
    re_path(
        rf"^_datacite/(?P<project_id>{id_prefix}-[0-9]+)/?$",
        DataciteJsonPreviewView.as_view(),
        name="datacite_preview",
    ),
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)(v(?P<revision>[0-9]+))?/?$",
        IndexView.as_view(),
        name="index",
    ),
    # Nested under the same path `index` above matches, so a file served from here is always in
    # the same subdirectory as the landing page that links to it -- see
    # PublicationFileDownloadView's docstring for why that matters (Google Scholar's
    # citation_pdf_url same-subdirectory requirement). Must come before the `index_fallback`
    # catch-all below, which would otherwise swallow this pattern first.
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)/files/(?P<path>.+)$",
        PublicationFileDownloadView.as_view(),
        name="file_download",
    ),
    re_path(r"^.*$", IndexView.as_view(), name="index_fallback"),
]
