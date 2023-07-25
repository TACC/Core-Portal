"""Workspace URLs
"""
from django.conf.urls import re_path
from portal.apps.workspace import views

urlpatterns = [
    re_path(r'^', views.WorkspaceView.as_view(), name="workspace"),
]
