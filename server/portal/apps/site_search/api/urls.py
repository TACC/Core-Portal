"""
.. module:: portal.apps.site_search.api.urls
   :synopsis: Site Search API URLs
"""
from django.urls import re_path
from portal.apps.site_search.api.views import SiteSearchApiView

app_name = 'site_search'
urlpatterns = [
    re_path('', SiteSearchApiView.as_view(), name='site_search_api'),
]
