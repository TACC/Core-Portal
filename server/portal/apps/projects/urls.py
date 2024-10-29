"""Data Depot API Urls
"""
from portal.apps.projects import views
from django.urls import path

app_name = 'projects'
urlpatterns = [
    path('system/<str:system_id>/', views.ProjectInstanceApiView.as_view(), name='project_sys'),
    path('<str:project_id>/members/', views.ProjectMembersApiView.as_view()),
    path('<str:project_id>/project-role/<str:username>/', views.get_project_role),
    path('<str:project_id>/system-role/<str:username>/', views.get_system_role),
    path('<str:project_id>/', views.ProjectInstanceApiView.as_view(), name='project'),
    path('<str:project_id>/entities/create', views.ProjectEntityView.as_view()),
    path('<str:root_system>', views.ProjectsApiView.as_view()),
    path('', views.ProjectsApiView.as_view(), name='projects_api')
]
