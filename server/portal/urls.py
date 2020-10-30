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

.. :module:: portal.urls
    :synopsis: Main URLs
"""


from cms.sitemaps import CMSSitemap
from django.conf import settings
from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.conf.urls.static import static
from core_apps_auth.views import agave_oauth as login
from portal.views.views import project_version as portal_version
from django.views.generic import RedirectView
from django.urls import path, re_path, include
admin.autodiscover()

urlpatterns = [

    path('sitemap.xml', sitemap, {'sitemaps': {'cmspages': CMSSitemap}}),

    # admin.
    path('core/admin/', admin.site.urls),
    path('impersonate/', include('impersonate.urls')),

    # terms-and-conditions
    path('terms/', include('termsandconditions.urls')),

    ## To Customize an accounts endpoint, let's point to where we make our changes
    path('accounts/', include('custom_accounts.urls', namespace='portal_accounts')),
    path('api/accounts/', include('core_apps_accounts.api.urls', namespace='portal_accounts_api')),

    path('onboarding/', include('onboarding.urls', namespace='portal_onboarding')),
    path('api/onboarding/', include('onboarding.api.urls', namespace='portal_onboarding_api')),
    path('register/', RedirectView.as_view(pattern_name='portal_accounts:register', permanent=True), name='register'),

    # auth.
    path('auth/', include('core_apps_auth.urls', namespace='portal_auth')),
    re_path('login/$', login),

    # api
    path('api/users/', include('users.urls', namespace='users')),
    path('api/workbench/', include('workbench.api.urls', namespace='workbench_api')),
    path('api/workspace/', include('workspace.api.urls', namespace='workspace_api')),
    path('api/tickets/', include('tickets.api.urls', namespace='portal_tickets_api')),
    path('api/datafiles/', include('datafiles.urls', namespace='datafiles')),
    path('api/system-monitor/', include('system_monitor.urls', namespace='system_monitor')),
    path('api/notifications/', include('notifications.urls', namespace='notifications')),

    # webhooks
    path('webhooks/', include('webhooks.urls', namespace='webhooks')),

    # views
    path('tickets/', include('tickets.urls', namespace='tickets')),
    path('workbench/', include('workbench.urls', namespace='workbench')),

    # version check.
    path('version/', portal_version),

    # everything else handled by django CMS
    path('', include('cms.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
