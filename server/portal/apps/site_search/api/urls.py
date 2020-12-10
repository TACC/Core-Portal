"""
.. module:: portal.apps.site_search.api.urls
   :synopsis: Site Search API URLs
"""
from django.urls import re_path
from portal.apps.site_search.api.views import IndexView

app_name = 'site_search'
urlpatterns = [
    re_path('', IndexView.as_view(), name='index'),
]
