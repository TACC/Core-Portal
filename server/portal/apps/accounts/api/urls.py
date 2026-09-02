"""
.. :module:: apps.accounts.api.urls
   :synopsis: Manager handling anything pertaining to accounts
"""
from django.urls import re_path
from portal.apps.accounts.api.views.systems import SystemKeysView

app_name = 'portal_accounts_api'
urlpatterns = [
    re_path(r'^systems/(?P<system_id>[\w.\-\/]+)/keys/?$',
            SystemKeysView.as_view()),
]
