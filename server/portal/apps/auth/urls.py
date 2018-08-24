"""
.. module:: portal.apps.auth.urls
   :synopsis: Auth URls
"""
# from django.conf import settings
from django.conf.urls import include, url
from django.core.urlresolvers import reverse
# from django.conf.urls.i18n import i18n_patterns
# from django.conf.urls.static import static
# from django.contrib import admin
from django.utils.translation import ugettext_lazy as _
from portal.apps.auth import views

urlpatterns = [
    url(r'^logged-out/$', views.logged_out, name='logout'),
    url(r'^agave/$', views.agave_oauth, name='agave_oauth'),
    url(r'^agave/callback/$', views.agave_oauth_callback, name='agave_oauth_callback'),
    url(r'^agave/session-error/$', views.agave_session_error, name='agave_session_error'),
]
