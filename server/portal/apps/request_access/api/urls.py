from django.urls import path
from portal.apps.request_access.api import views

app_name = 'request_access_api'
urlpatterns = [
    path('', views.RequestAccessView.as_view()),
]
