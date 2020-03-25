from django.conf.urls import url
from django.urls import path
from portal.apps.users.views import SearchView, AuthenticatedView, UsageView, AllocationsView, TeamView, UserDataView

app_name = 'users'
urlpatterns = [
    url(r'^$', SearchView.as_view(), name='user_search'),
    url(r'^auth/$', AuthenticatedView.as_view(), name='user_authenticated'),
    url(r'^usage/$', UsageView.as_view(), name='user_usage'),
    url(r'^allocations/$', AllocationsView.as_view(), name='user_allocations'),
    path('team/<int:project_id>', TeamView.as_view(), name='user_team'),
    path('team/user/<slug:username>', UserDataView.as_view(), name='user_data')
]
