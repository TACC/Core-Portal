"""Jupyter Mounts API Urls
"""
from django.urls import path
from portal.apps.jupyter_mounts.api import views

app_name = 'jupyter_mounts'

urlpatterns = [
    path('', views.JupyterMountsApiView.as_view(), name='jupyter_mounts_api'),
]
