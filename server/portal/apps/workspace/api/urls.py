"""Workpace API Urls
"""
from django.conf.urls import url
from portal.apps.workspace.api import views

urlpatterns = [
    # url(r'^(?P<service>[a-z]+?)/$', views.call_api, name='call_api'),
    url(r'^apps/?', views.AppsView.as_view()),
    url(r'^meta/?', views.MetadataView.as_view()),
    url(r'^jobs/?', views.JobsView.as_view()),
    url(r'^monitors/?', views.MonitorsView.as_view()),

]
