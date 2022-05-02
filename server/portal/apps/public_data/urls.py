"""
.. module:: portal.apps.site_search.urls
   :synopsis: Site Search URLs
"""
from django.urls import re_path
from portal.apps.public_data.views import IndexView

app_name = 'public_data'
urlpatterns = [
    re_path('', IndexView.as_view(), name='index'),
]
