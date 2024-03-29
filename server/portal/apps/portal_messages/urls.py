"""Message URLs
"""
from django.urls import path
from portal.apps.portal_messages import views


app_name = 'message'
urlpatterns = [
    path('intro/', views.IntroMessagesView.as_view()),
    path('custom/', views.CustomMessagesView.as_view())
]
