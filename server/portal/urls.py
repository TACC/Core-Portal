"""server URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
"""
.. :module:: portal.urls
    :synopsis: Main URLs
"""

from django.conf import settings
from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.conf.urls.static import static
from django.views.generic import RedirectView

from django.contrib.auth.views import logout as portal_logout
from portal.apps.auth.views import agave_oauth as login
from portal.views.views import project_version as portal_version

from django.urls import path, re_path, include

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.core import urls as wagtail_urls

admin.autodiscover()

# urlpatterns = [
#     url(r'^sitemap\.xml$', sitemap,
#         {'sitemaps': {'cmspages': CMSSitemap}}),
# ]

urlpatterns += [

    # admin.
    url(r'^admin/', admin.site.urls),

    # terms-and-conditions
    url(r'^terms/', include('termsandconditions.urls')),

    # auth.
    url(r'^accounts/', include('portal.apps.accounts.urls',
                               namespace='portal_accounts')),
    url(r'^api/accounts/',
        include(
            'portal.apps.accounts.api.urls',
            namespace='portal_accounts_api'
        )),

    url(r'^register/$',
        RedirectView.as_view(
            pattern_name='portal_accounts:register',
            permanent=True),
        name='register'),
    url(r'^auth/', include('portal.apps.auth.urls',
                           namespace='portal_auth')),
    url(r'^logout/$', portal_logout,
        {'next_page': '/auth/logged-out/'}, name='logout'),
    url(r'^login/$', login),

    # version check.
    url(r'^version/', portal_version),

    re_path(r'^cms/', include(wagtailadmin_urls)),
    re_path(r'^documents/', include(wagtaildocs_urls)),
    re_path(r'^pages/', include(wagtail_urls)),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
