"""
.. :module:: apps.accounts.api.urls
   :synopsis: Manager handling anything pertaining to accounts
"""
from django.conf.urls import url
from portal.apps.onboarding.api.views import (
    SetupStepView,
    SetupAdminView
)


app_name = 'portal_onboarding_api'
urlpatterns = [
    url(r'^user/$', SetupStepView.as_view(), name='user_self_view'),
    url(r'^user/(?P<username>[\w]+)/?$', SetupStepView.as_view(), name='user_view'),
    url(r'^admin/$', SetupAdminView.as_view(), name='user_admin')
]
