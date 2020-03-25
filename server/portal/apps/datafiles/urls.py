from django.urls import path
from portal.apps.datafiles.views import (TapisFilesView,
                                         SystemListingView)


app_name = 'users'
urlpatterns = [
    path('systems/list/', SystemListingView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/',
         TapisFilesView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/<path:path>/',
         TapisFilesView.as_view()),
]
