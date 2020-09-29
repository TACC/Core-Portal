"""
.. module:: core_apps_accounts.urls
   :synopsis: Accounts URLs
"""
from django.urls import re_path
from portal.apps.workbench.views import IndexView

app_name = 'workbench'
urlpatterns = [
    re_path('dashboard', IndexView.as_view(), name='dashboard'),
    re_path('', IndexView.as_view(), name='index'),
]
