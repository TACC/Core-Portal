"""
.. module:: portal.apps.auth.urls
   :synopsis: Auth URls
"""
from django.conf.urls import url
from portal.apps.auth import views

app_name = 'portal_auth'
urlpatterns = [
    url(r'^logged-out/$', views.logged_out, name='logout'),
    url(r'^agave/$', views.agave_oauth, name='agave_oauth'),
    url(r'^agave/callback/$', views.agave_oauth_callback, name='agave_oauth_callback'),
    url(r'^agave/session-error/$', views.agave_session_error, name='agave_session_error'),
]
