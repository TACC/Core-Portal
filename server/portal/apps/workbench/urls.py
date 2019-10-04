"""
.. module:: portal.apps.accounts.urls
   :synopsis: Accounts URLs
"""
from django.conf.urls import url
from portal.apps.workbench.views import IndexView

app_name = 'workbench'
urlpatterns = [
    url(r'^', IndexView.as_view(), name='index'),
]
