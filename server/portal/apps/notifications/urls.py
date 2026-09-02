from django.urls import re_path
from portal.apps.notifications.views import ManageNotificationsView


app_name = 'notifications'
urlpatterns = [
    re_path(r'^(?P<pk>\w+)?$', ManageNotificationsView.as_view(), name='event_type_notifications'),
]
