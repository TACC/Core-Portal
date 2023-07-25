"""
.. module:: portal.apps.accounts.urls
   :synopsis: Accounts URLs
"""
from django.conf.urls import re_path
from django.contrib.auth.views import LogoutView
from portal.apps.accounts.views import accounts
from portal.apps.accounts import views


app_name = 'portal_accounts'
urlpatterns = [
    re_path(r'^logout/?', LogoutView.as_view(), name='logout'),
    re_path(r'^profile/', accounts, name='manage_profile'),
    re_path(r'^api/profile/data/', views.get_profile_data, name='get_profile_data'),
]
