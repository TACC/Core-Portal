"""Webhooks URLs
"""
from django.conf.urls import url
from portal.apps.webhooks import views

urlpatterns = [
    url(r'^$', views.generic_webhook_handler, name='generic_wh_handler'),
    url(r'^jobs/$', views.JobsWebhookView.as_view(), name='jobs_wh_handler'),
]
