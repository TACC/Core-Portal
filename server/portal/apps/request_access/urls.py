"""
.. module:: portal.apps.site_search.urls
   :synopsis: Site Search URLs
"""
from django.urls import re_path
from portal.apps.request_access.views import IndexView

app_name = 'request_access'
urlpatterns = [
    path('', IndexView.as_view(), name='index'),
]
