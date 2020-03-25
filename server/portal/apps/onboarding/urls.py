"""
.. module:: portal.apps.onboarding.urls
   :synopsis: Onboarding URLs
"""
from django.conf.urls import url
from portal.apps.onboarding.views import (
    SetupStatusView, 
    SetupAdminView
)
from portal.apps.onboarding import views


urlpatterns = [
    # Holding page for users that are not setup_complete
    url(r'^setup(?:/(?P<username>[\w]+))?', view=SetupStatusView.as_view(), name='holding'),
    url(r'^admin/?', view=SetupAdminView.as_view(), name='admin')
]
