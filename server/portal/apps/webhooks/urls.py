"""Webhooks URLs
"""
from django.conf.urls import url
from portal.apps.webhooks import views

urlpatterns = [
    url(r'^$', views.generic_webhook_handler),
    url(r'^jobs/$', views.job_notification_handler, name='jobs_webhook'),
    # url(r'^webhook', views.webhook, name='webhook'),
]
