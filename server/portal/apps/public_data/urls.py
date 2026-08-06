"""
.. module:: portal.apps.site_search.urls
   :synopsis: Site Search URLs
"""
from django.urls import re_path
from portal.apps.public_data.views import IndexView

app_name = 'public_data'
urlpatterns = [
    # re_path('', IndexView.as_view(), name='index'),
    re_path(
    r'^drp\.project\.published\.(?P<project_id>DRP-[0-9]+)(v(?P<revision>[0-9]+))?/?$',
    IndexView.as_view(),
    name='index'
),
]
