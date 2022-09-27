"""
.. module:: portal.apps.auth.urls
   :synopsis: Auth URls
"""
from django.conf.urls import url
from portal.apps.auth import views

app_name = 'portal_auth'
urlpatterns = [
    url(r'^logged-out/$', views.logged_out, name='logout'),
    url(r'^tapis/$', views.tapis_oauth, name='tapis_oauth'),
    url(r'^tapis/callback/$', views.tapis_oauth_callback, name='tapis_oauth_callback'),
]
