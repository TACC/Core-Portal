from django.conf.urls import include, url

from portal.apps.djangoRT import views

app_name = 'tickets'
urlpatterns = [
		url(r'^$', views.mytickets, name='mytickets'),
		url(r'^ticket/(?P<ticketId>\d+)/$', views.ticketdetail, name='detail'),
		url(r'^ticket/new/$', views.ticketcreate, name='create'),
		url(r'^ticket/reply/(?P<ticketId>\d+)/$', views.ticketreply, name='reply'),
]
