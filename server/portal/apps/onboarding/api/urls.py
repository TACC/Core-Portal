"""
.. :module:: apps.accounts.api.urls
   :synopsis: Manager handling anything pertaining to accounts
"""
from django.conf.urls import url
from portal.apps.onboarding.api.views import (
    SetupStepView,
    SetupAdminView
)

urlpatterns = [
    url(r'^user/(?P<username>[\w]+)/?$', SetupStepView.as_view(), name='user_view'),
    url(r'^admin/$', SetupAdminView.as_view(), name='user_admin')
]
