"""
.. module:: .urls
   :synopsis: Accounts URLs
"""
from django.conf.urls import url
from core_apps_accounts.views import LogoutView
from core_apps_accounts import views
from workbench.views import IndexView as ReactView

## most of this remains the same as our original functionality, we do need a reference to our new view
from custom_accounts import views as custom_accounts_views

app_name = 'portal_accounts'
urlpatterns = [
    url(r'^logout/?', LogoutView.as_view(), name='logout'),

    # Endpoints for React based profile-page
    url(r'^profile/', ReactView.as_view(), name='manage_profile'),

    ## let's point the endpoint we want to to update to our custom code
    url(r'^api/profile/data/', custom_accounts_views.get_profile_data, name='get_profile_data'),

    url(r'^api/profile/fields/', views.get_form_fields, name='get_form_fields'),
    url(r'^api/profile/change-password/', views.change_password, name='change_password'),
    url(r'^api/profile/edit-profile/', views.edit_profile, name='edit_profile'),
    url(r'^api/profile/licenses/', views.manage_licenses, name='get_licenses'),

    url(r'^departments\.json$', views.departments_json, name='departments_json'),

    # These need to go last else they intercept other routes.
    url(r'^$', ReactView.as_view(), name='manage_profile')
]
