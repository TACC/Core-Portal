from django.conf.urls import include, url
from django.urls import path
from portal.apps.djangoRT.api import views

app_name = 'portal_tickets_api'
urlpatterns = [
	path('', views.TicketsView.as_view())
]