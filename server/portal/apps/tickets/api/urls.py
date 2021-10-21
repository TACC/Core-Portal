from django.urls import path
from portal.apps.tickets.api import views

app_name = 'portal_tickets_api'
urlpatterns = [
    path('<int:ticket_id>', views.TicketsView.as_view()),
    path('', views.TicketsView.as_view()),
    path('<int:ticket_id>/history', views.TicketsHistoryView.as_view()),
    path('sitekey',views.SiteKeyView.as_view())
]
