"""Data Depot API Urls
"""
from django.conf.urls import url
from portal.apps.projects import views

urlpatterns = [
    url(r'^(?P<project_uuid>[a-z0-9\-]+)/$',
        views.ProjectInstanceView.as_view(), name='project_instance'),
    url(r'^$', views.ProjectView.as_view(), name='project'),

]
