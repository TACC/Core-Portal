"""
.. module:: portal.apps.accounts.urls
   :synopsis: Accounts URLs
"""
from django.conf.urls import url
from portal.apps.accounts.views import LogoutView
from portal.apps.accounts import views
from portal.apps.workbench.views import IndexView as ReactView


app_name = 'portal_accounts'
urlpatterns = [
    url(r'^logout/?', LogoutView.as_view(), name='logout'),

    # Endpoints for React based profile-page
    url(r'^profile/', ReactView.as_view(), name='manage_profile'),
    url(r'^api/profile/data/', views.get_profile_data, name='get_profile_data'),
    url(r'^api/profile/fields/', views.get_form_fields, name='get_form_fields'),
    url(r'^api/profile/change-password/', views.change_password, name='change_password'),
    url(r'^api/profile/edit-profile/', views.edit_profile, name='edit_profile'),
    url(r'^api/profile/licenses/', views.manage_licenses, name='get_licenses'),

    url(r'^departments\.json$', views.departments_json, name='departments_json'),

    # These need to go last else they intercept other routes.
    url(r'^$', ReactView.as_view(), name='manage_profile')
]
