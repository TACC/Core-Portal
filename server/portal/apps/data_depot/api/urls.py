"""Data Depot API Urls
"""
from django.conf.urls import url
from portal.apps.data_depot.api import views

urlpatterns = [
    url(r'^files/listing/(?P<file_mgr_name>[\w.-]+)/(?P<file_id>[\w.\- \/]+)/?',
        views.FileListingView.as_view()),
    url(r'^files/media/(?P<file_mgr_name>[\w.-]+)/(?P<file_id>[\w.\- \/]+)/?',
        views.FileMediaView.as_view()),
    url(r'^files/pems/(?P<file_mgr_name>[\w.-]+)/(?P<file_id>[\w.\- \/]+)/?',
        views.FilePemsView.as_view()),
    url(r'^toolbar/params', views.ToolbarOptionsView.as_view()),
    url(r'systems/list', views.SystemListingView.as_view()),
]
