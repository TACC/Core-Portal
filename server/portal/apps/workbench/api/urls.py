from django.urls import path
from portal.apps.workbench.api import views

app_name = 'workbench_api'
urlpatterns = [
    path('', views.workbench_state, name='state'),
]
