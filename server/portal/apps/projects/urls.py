"""Data Depot API Urls
"""
from portal.apps.projects import views
from django.urls import path

app_name = 'projects'
urlpatterns = [
    path('system/<str:system_id>/', views.ProjectInstanceApiView.as_view(), name='project_sys'),
    path('<str:project_id>/members/', views.ProjectMembersApiView.as_view()),
    path('<str:project_id>/', views.ProjectInstanceApiView.as_view(), name='project'),
    path('', views.ProjectsApiView.as_view(), name='projects_api')
]
