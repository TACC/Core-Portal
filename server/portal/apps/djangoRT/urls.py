from django.urls import path
from portal.apps.djangoRT import views

app_name = 'tickets'
urlpatterns = [
    path('', views.tickets, name='mytickets'),
    path('new/', views.ticket_create, name='create'),
]
