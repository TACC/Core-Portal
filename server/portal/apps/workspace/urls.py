"""Workspace URLs
"""
from django.conf.urls import url
from portal.apps.workspace import views

urlpatterns = [
    url(r'^', views.WorkspaceView.as_view(), name="workspace"),
]
