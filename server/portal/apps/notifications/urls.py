from django.conf.urls import url

from portal.apps.notifications.views import ManageNotificationsView, NotificationsBadgeView


app_name = 'notifications'
urlpatterns = [
    url(r'^$', ManageNotificationsView.as_view(), name='event_type_notifications'),
    url(r'^badge/$', NotificationsBadgeView.as_view(), name='badge'),
    url(r'^delete/(?P<pk>\w+)?$', ManageNotificationsView.as_view(), name='delete_notification'),
]
