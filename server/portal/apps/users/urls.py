from django.conf.urls import url
from django.urls import path
from portal.apps.users.views import (SearchView, AuthenticatedView, UsageView, AllocationsView, TeamView,
                                     UserDataView, AllocationUsageView, AllocationManagementView)

app_name = 'users'
urlpatterns = [
    url(r'^$', SearchView.as_view(), name='user_search'),
    url(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
    path('usage/<slug:system_id>', UsageView.as_view(), name='user_usage'),
    url(r'^allocations/$', AllocationsView.as_view(), name='user_allocations'),
    path('team/<slug:project_name>', TeamView.as_view(), name='user_team'),
    path('team/user/<slug:username>', UserDataView.as_view(), name='user_data'),
    path('team/usage/<slug:allocation_id>', AllocationUsageView.as_view(), name='allocation_usage'),
    path('team/manage/<slug:project_id>/<slug:user_id>', AllocationManagementView.as_view(), name='allocation_management')
]
