"""Workpace API Urls
"""
from django.conf.urls import url
from portal.apps.workspace.api import views


app_name = 'workspace_api'
urlpatterns = [
    # url(r'^(?P<service>[a-z]+?)/$', views.call_api, name='call_api'),
    url(r'^apps/?', views.AppsView.as_view()),
    url(r'^meta/?', views.MetadataView.as_view()),
    url(
        r'^jobs/(?P<job_uuid>[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}\-[0-9a-fA-F]{3})/history/?$',
        views.JobHistoryView.as_view()
    ),
    url(r'^jobs/?', views.JobsView.as_view()),
    url(r'^monitors/?', views.MonitorsView.as_view()),
    url(r'^systems/?', views.SystemsView.as_view()),
    url(r'^tray/?', views.AppsTrayView.as_view())

]
