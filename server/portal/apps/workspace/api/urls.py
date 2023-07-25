"""Workpace API Urls
"""
from django.conf.urls import re_path
from portal.apps.workspace.api import views


app_name = 'workspace_api'
urlpatterns = [
    re_path(r'^apps/?', views.AppsView.as_view()),
    re_path(
        r'^jobs/(?P<job_uuid>[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}\-[0-9a-fA-F]{3})/history/?$',
        views.JobHistoryView.as_view()
    ),
    re_path(r'^jobs/(?P<operation>\w+)/?$', views.JobsView.as_view()),
    re_path(r'^jobs/?', views.JobsView.as_view()),
    # TODOv3: dropV2Jobs
    re_path(r'^historic/?', views.HistoricJobsView.as_view()),
    re_path(r'^systems/?', views.SystemsView.as_view()),
    re_path(r'^tray/?', views.AppsTrayView.as_view())

]
