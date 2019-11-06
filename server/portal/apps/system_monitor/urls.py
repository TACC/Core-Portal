
from django.conf.urls import url
from portal.apps.system_monitor import views

app_name = 'system_monitor'
urlpatterns = [
    url(r'^$',views.SysmonDataView.as_view(),name='system_monitor'),
]
