from portal.apps.googledrive_integration import views
from django.urls import path
app_name = 'googledrive_integration'
urlpatterns = [
    path('', views.IndexView.as_view(), name='privacy'),
    path('initialize/', views.initialize_token, name='initialize'),
    path('oauth2/', views.oauth2_callback, name='oauth2_callback'),
    path('disconnect/', views.disconnect, name='disconnect')
]
