
from django.urls import path
from portal.apps.system_monitor import views

app_name = 'system_monitor'
urlpatterns = [
    path('', views.SysmonDataView.as_view(), name='system_monitor'),
    path('<str:system_name>', views.SysmonDataView.as_view(), name='system_monitor'),
]
