"""Search API Urls
"""
from django.conf.urls import url
from portal.apps.search.api import views

urlpatterns = [
    url(r'^$', views.SearchApiView.as_view())
]
