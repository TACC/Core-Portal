"""
.. module:: portal.apps.public_data.urls
   :synopsis: Public Data URLs
"""
from django.conf.urls import url
from portal.apps.public_data.views import IndexView


urlpatterns = [
    url(r'^', IndexView.as_view(), name='index'),
]
