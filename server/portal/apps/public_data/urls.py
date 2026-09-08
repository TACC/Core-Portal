"""
.. module:: portal.apps.site_search.urls
   :synopsis: Site Search URLs
"""

import re

from django.conf import settings
from django.urls import re_path

from portal.apps.public_data.views import IndexView

app_name = "public_data"

published_prefix = re.escape(settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX or "")
id_prefix = re.escape(settings.PORTAL_PROJECTS_ID_PREFIX or "")

urlpatterns = [
    re_path(
        rf"^{published_prefix}\.(?P<project_id>{id_prefix}-[0-9]+)(v(?P<revision>[0-9]+))?/?$",
        IndexView.as_view(),
        name="index",
    ),
    re_path(r"^.*$", IndexView.as_view(), name="index_fallback"),
]
