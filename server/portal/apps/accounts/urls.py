"""
.. module:: portal.apps.accounts.urls
   :synopsis: Accounts URLs
"""
from django.conf.urls import url
from django.urls import path
from portal.apps.accounts.views import (
    IndexView,
    LogoutView,
    # RegisterView
)
from portal.apps.accounts import views
from portal.apps.workbench.views import IndexView as ReactView


app_name = 'portal_accounts'
urlpatterns = [
    url(r'^logout/?', LogoutView.as_view(), name='logout'),
    # url(r'^register/?', RegisterView.as_view(), name='register'),
    # url(r'^request-access/?', view=views.request_access, name='request-access'),

    # Endpoints for React based profile-page
    url(r'^profile/$', ReactView.as_view(), name='manage_profile'),
    url(r'^change-password/', views.change_password, name='change_password'),
    url(r'^edit-profile/', views.edit_profile, name='edit_profile'),
    url(r'^api/profile/', views.get_profile_data, name='get_profile_data'),
    url(r'^api/licenses/', views.manage_licenses, name='manage_licenses'),
    url(r'^api/applications/$', views.manage_applications, name='manage_applications'),
    url(r'^api/fields/', views.get_form_fields, name='get_form_fields'),
    url(r'^api/check/', views.authenticate_user, name='authenticate_user'),

    # TODO: Make a front-end route
    url(r'^profile/edit/$', views.profile_edit, name='profile_edit'),

    # url(r'^professional-profile/$', views.manage_pro_profile, name='manage_pro_profile'),
    # url(r'^professional-profile/edit$', views.pro_profile_edit, name='pro_profile_edit'),

    url(r'^authentication/$', views.manage_authentication, name='manage_authentication'),
    # url(r'^identities/$', views.manage_identities, name='manage_identities'),

    # url(r'^licenses/$', views.manage_licenses, name='manage_licenses'),
    # url(r'^onboarding/$', views.manage_onboarding, name='manage_onboarding'),
    # url(r'^applications/$', views.manage_applications, name='manage_applications'),

    # url(r'^notifications/settings/$', views.manage_notifications, name='manage_notifications'),

    url(r'^password-reset/(?:(?P<code>.+)/)?$', views.password_reset, name='password_reset'),

    url(r'^departments\.json$', views.departments_json, name='departments_json'),

    path('load-departments/', views.load_departments, name='load_departments'),

    # These need to go last else they intercept other routes.
    url(r'^$', IndexView.as_view(), name='index'),

]
