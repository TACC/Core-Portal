"""Webhooks URLs
"""
from django.conf.urls import url
from portal.apps.webhooks import views

urlpatterns = [
    url(r'^jobs/$', views.JobsWebhookView.as_view(), name='jobs_wh_handler'),
    url(r'^interactive/$', views.InteractiveWebhookView.as_view(), name='interactive_wh_handler'),
    url(r'^onboarding/$', views.OnboardingWebhookView.as_view(), name='onboarding_wh_handler'),
]
