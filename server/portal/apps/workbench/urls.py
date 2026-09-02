"""
.. module:: portal.apps.accounts.urls
   :synopsis: Accounts URLs
"""
from django.urls import re_path
from portal.apps.workbench.views import IndexView

app_name = 'workbench'
urlpatterns = [
    re_path('account', IndexView.as_view(), name='account'),
    re_path('dashboard', IndexView.as_view(), name='dashboard'),
    re_path('onboarding/admin', IndexView.as_view(), name='onboarding_admin'),
    re_path('', IndexView.as_view(), name='index'),
]
