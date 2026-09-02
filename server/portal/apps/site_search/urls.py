"""
.. module:: portal.apps.site_search.urls
   :synopsis: Site Search URLs
"""
from django.urls import re_path
from portal.apps.site_search.views import IndexView

app_name = 'site_search'
urlpatterns = [
    re_path('', IndexView.as_view(), name='index'),
]
