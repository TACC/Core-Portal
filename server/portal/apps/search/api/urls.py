"""Search API Urls
"""
from django.urls import path
from portal.apps.search.api import views


app_name = 'search'
urlpatterns = [
    path('', views.SearchApiView.as_view())
]
