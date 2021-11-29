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


from django.conf import settings
from django.contrib import admin
from django.conf.urls.static import static
from portal.apps.auth.views import agave_oauth as login
from portal.views.views import project_version as portal_version
from django.views.generic import RedirectView
from django.views.generic.base import TemplateView
from django.urls import path, re_path, include
admin.autodiscover()

urlpatterns = [

    # admin.
    path('core/admin/', admin.site.urls),
    path('core/admin/impersonate/', include('impersonate.urls')),

    # terms-and-conditions
    path('terms/', include('termsandconditions.urls')),

    # accounts.
    path('accounts/', include('portal.apps.accounts.urls', namespace='portal_accounts')),
    path('api/accounts/', include('portal.apps.accounts.api.urls', namespace='portal_accounts_api')),

    path('api/onboarding/', include('portal.apps.onboarding.api.urls', namespace='portal_onboarding_api')),
    path('register/', RedirectView.as_view(pattern_name='portal_accounts:register', permanent=True), name='register'),

    # auth.
    path('auth/', include('portal.apps.auth.urls', namespace='portal_auth')),
    re_path('login/$', login),

    # markup
    re_path('core/markup/nav', TemplateView.as_view(template_name='includes/nav_portal.raw.html'), name='portal_nav_markup'),

    # api
    path('api/users/', include('portal.apps.users.urls', namespace='users')),
    path('api/workbench/', include('portal.apps.workbench.api.urls', namespace='workbench_api')),
    path('api/workspace/', include('portal.apps.workspace.api.urls', namespace='workspace_api')),
    path('api/tickets/', include('portal.apps.tickets.api.urls', namespace='portal_tickets_api')),
    path('api/datafiles/', include('portal.apps.datafiles.urls', namespace='datafiles')),
    path('api/system-monitor/', include('portal.apps.system_monitor.urls', namespace='system_monitor')),
    path('api/notifications/', include('portal.apps.notifications.urls', namespace='notifications')),
    path('api/jupyter_mounts/', include('portal.apps.jupyter_mounts.api.urls', namespace='jupyter_mounts_api')),
    path('api/projects/', include('portal.apps.projects.urls', namespace='projects')),
    path('api/site-search/', include('portal.apps.site_search.api.urls', namespace='site_search_api')),

    # webhooks
    path('webhooks/', include('portal.apps.webhooks.urls', namespace='webhooks')),

    # views
    path('tickets/', include('portal.apps.tickets.urls', namespace='tickets')),
    path('googledrive-privacy-policy/',
         include('portal.apps.googledrive_integration.urls',
                 namespace='googledrive-privacy-policy')),
    path('workbench/', include('portal.apps.workbench.urls', namespace='workbench')),
    path('public-data/', include('portal.apps.public_data.urls', namespace='public')),
    path('search/', include('portal.apps.site_search.urls', namespace='site_search')),

    # intromessages
    path('api/intromessages/', include('portal.apps.intromessages.urls', namespace='intromessages')),


    # integrations
    path('accounts/applications/googledrive/', include('portal.apps.googledrive_integration.urls', namespace='googledrive_integration')),

    # version check.
    path('version/', portal_version),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
