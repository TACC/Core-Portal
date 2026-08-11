"""
.. module:: portal.apps.site_search.urls
   :synopsis: Site Search URLs
"""
from django.urls import re_path
from portal.apps.public_data.views import IndexView

app_name = 'public_data'
urlpatterns = [
    re_path(
        # Match DRP prod or pprd project IDs
        r'^drp\.(?:pprd\.)?project\.published\.(?P<project_id>DRP(?:-PPRD)?-[0-9]+)(v(?P<revision>[0-9]+))?/?$',
        IndexView.as_view(),
        name='index'
    ),
    re_path(r'^.*$', IndexView.as_view(), name='index_fallback'),
]
