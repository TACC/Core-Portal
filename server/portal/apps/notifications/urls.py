from django.conf.urls import url
from portal.apps.notifications.views import ManageNotificationsView


app_name = 'notifications'
urlpatterns = [
    url(r'^(?P<pk>\w+)?$', ManageNotificationsView.as_view(), name='event_type_notifications'),
]
