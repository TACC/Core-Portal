"""
.. module:: portal.apps.auth.urls
   :synopsis: Auth URls
"""
from django.conf.urls import re_path
from portal.apps.auth import views

app_name = 'portal_auth'
urlpatterns = [
    re_path(r'^logged-out/$', views.logged_out, name='logout'),
    re_path(r'^tapis/$', views.tapis_oauth, name='tapis_oauth'),
    re_path(r'^tapis/callback/$', views.tapis_oauth_callback, name='tapis_oauth_callback'),
]
