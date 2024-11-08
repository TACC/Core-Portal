"""Publications API Urls
"""
from portal.apps.publications import views
from django.urls import path

app_name = 'publications'
urlpatterns = [
    path('publication-request/', views.PublicationRequestView.as_view(), name='publication_request'),
    path('publication-request/<str:project_id>/', views.PublicationRequestView.as_view(), name='publication_request_detail'),
    path('publish/', views.PublicationPublishView.as_view(), name='publication_publish'),
    path('reject/', views.PublicationRejectView.as_view(), name='publication_reject'),
    path('version/', views.PublicationVersionView.as_view(), name='publication_version'),
    path('', views.PublicationListingView.as_view(), name='publication_listing'),
]