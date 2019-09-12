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

from portal.apps.auth.views import agave_oauth as login
from portal.views.views import project_version as portal_version

from django.urls import path, re_path, include

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from wagtail.core import urls as wagtail_urls
from wagtail.contrib.sitemaps.views import sitemap

admin.autodiscover()

urlpatterns = [

    url(r'^sitemap\.xml$', sitemap),

    # admin.
    url(r'^admin/', admin.site.urls),

    # terms-and-conditions
    url(r'^terms/', include('termsandconditions.urls')),

    # accounts.
    url(r'^accounts/', include('portal.apps.accounts.urls',
                               namespace='portal_accounts')),

    # auth.
    url(r'^auth/', include('portal.apps.auth.urls',
                           namespace='portal_auth')),
    url(r'^login/$', login),

    # version check.
    url(r'^version/', portal_version),

    re_path(r'^cms/', include(wagtailadmin_urls)),
    re_path(r'^documents/', include(wagtaildocs_urls)),
    re_path(r'^pages/', include(wagtail_urls)),

    # For anything not caught by a more specific rule above, hand over to
    # Wagtail's serving mechanism
    re_path(r'', include(wagtail_urls)),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
