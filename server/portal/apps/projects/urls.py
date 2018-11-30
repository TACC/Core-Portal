"""Data Depot API Urls
"""
from django.conf.urls import url
from portal.apps.projects import views

urlpatterns = [
    url(
        r'^system/(?P<system_id>[\w\.\-]+)/?',
        views.ProjectInstanceApiView.as_view(),
        name='project_sys'
    ),
    url(
        r'^(?P<project_id>[\w\.\-]+)/members/?',
        views.ProjectMembersApiView.as_view()
    ),
    url(
        r'^(?P<project_id>[\w\.\-]+)/?',
        views.ProjectInstanceApiView.as_view(),
        name='project'
    ),
    url(r'^', views.ProjectsApiView.as_view(), name='project_api'),
]
