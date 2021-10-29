"""IntroMessages URLs
"""
from django.urls import path
from portal.apps.intromessages import views


app_name = 'msg'
urlpatterns = [
    path('msg/', views.IntroMessagesView.as_view(), name='msg'),
]