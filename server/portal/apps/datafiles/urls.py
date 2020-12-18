from django.urls import path
from portal.apps.datafiles.views import (TapisFilesView,
                                         GoogleDriveFilesView,
                                         TransferFilesView,
                                         LinkView,
                                         SystemListingView)


app_name = 'users'
urlpatterns = [
    path('systems/list/', SystemListingView.as_view()),
    path('transfer/<str:filetype>/', TransferFilesView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/',
         TapisFilesView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/<path:path>/',
         TapisFilesView.as_view()),
    path('googledrive/<str:operation>/<str:scheme>/<str:system>/',
         GoogleDriveFilesView.as_view()),
    path('googledrive/<str:operation>/<str:scheme>/<str:system>/<path:path>/',
         GoogleDriveFilesView.as_view()),
    path('link/<str:scheme>/<str:system>/<path:path>',
         LinkView.as_view())
]
