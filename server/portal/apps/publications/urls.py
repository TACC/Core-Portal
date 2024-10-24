"""Publications API Urls
"""
from portal.apps.publications import views
from django.urls import path

app_name = 'publications'
urlpatterns = [
    path('publication-request/', views.PublicationRequestView.as_view(), name='publication_request'),
    path('publication-request/<str:project_id>/', views.PublicationRequestView.as_view(), name='publication_request_detail'),
]