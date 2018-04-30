"""
.. :module:: apps.accounts.api.urls
   :synopsis: Manager handling anything pertaining to accounts
"""
from django.conf.urls import url
from portal.apps.accounts.api.views.systems import SystemsListView

urlpatterns = [
    url(r'^systems/list/?$', SystemsListView.as_view()),
]
