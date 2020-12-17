from django.urls import path
from portal.apps.datafiles.views import (TapisFilesView,
                                         LinkView,
                                         SystemListingView)


app_name = 'users'
urlpatterns = [
    path('systems/list/', SystemListingView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/',
         TapisFilesView.as_view()),
    path('tapis/<str:operation>/<str:scheme>/<str:system>/<path:path>/',
         TapisFilesView.as_view()),
    path('link/<str:scheme>/<str:system>/<path:path>',
         LinkView.as_view())
]
