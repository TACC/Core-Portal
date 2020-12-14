from django.urls import path
from portal.apps.datafiles.views import (TapisFilesView,
                                         GoogleDriveFilesView,
                                         TransferFilesView,
                                         SystemListingView)


app_name = 'users'
urlpatterns = [
    path('systems/list/', SystemListingView.as_view()),
    path('transfer/<str:format>/', TransferFilesView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/',
         TapisFilesView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/<path:path>/',
         TapisFilesView.as_view()),
    path('googledrive/<str:operation>/<str:scheme>/<str:system>/',
         GoogleDriveFilesView.as_view()),
    path('googledrive/<str:operation>/<str:scheme>/<str:system>/<path:path>/',
         GoogleDriveFilesView.as_view()),
]
