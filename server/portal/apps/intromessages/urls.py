"""IntroMessages URLs
"""
from django.urls import path
from portal.apps.intromessages import views


app_name = 'intromessages'
urlpatterns = [
    path('', views.IntroMessagesView.as_view()),
]
