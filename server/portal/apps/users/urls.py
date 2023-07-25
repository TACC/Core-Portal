from django.conf.urls import re_path
from django.urls import path
from portal.apps.users.views import (SearchView, AuthenticatedView, UsageView, AllocationsView, TeamView,
                                     UserDataView, TasUsersView, AllocationUsageView, AllocationManagementView)

app_name = 'users'
urlpatterns = [
    re_path(r'^$', SearchView.as_view(), name='user_search'),
    re_path(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
    path('usage/<slug:system_id>', UsageView.as_view(), name='user_usage'),
    re_path(r'^allocations/$', AllocationsView.as_view(), name='user_allocations'),
    path('tas-users/', TasUsersView.as_view(), name='tas_users'),
    path('team/<slug:project_id>', TeamView.as_view(), name='user_team'),
    path('team/user/<slug:username>', UserDataView.as_view(), name='user_data'),
    path('team/usage/<slug:allocation_id>', AllocationUsageView.as_view(), name='allocation_usage'),
    path('team/manage/<slug:project_id>/<slug:user_id>', AllocationManagementView.as_view(), name='allocation_management')
]
