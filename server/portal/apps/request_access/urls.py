from django.urls import path
from portal.apps.request_access.views import IndexView

app_name = 'request_access'
urlpatterns = [
    path('', IndexView.as_view(), name='index'),
]
