"""
.. :module:: apps.accounts.api.urls
   :synopsis: Manager handling anything pertaining to accounts
"""
from django.conf.urls import url
from portal.apps.accounts.api.views.systems import SystemKeysView

app_name = 'portal_accounts_api'
urlpatterns = [
    url(r'^systems/(?P<system_id>[\w.\-\/]+)/keys/?$',
        SystemKeysView.as_view()),
]
