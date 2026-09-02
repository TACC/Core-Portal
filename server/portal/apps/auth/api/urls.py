from django.urls import path
from portal.apps.auth.api.views import TapisToken


app_name = 'auth_api'
urlpatterns = [
    path('tapis/', TapisToken.as_view(), name='tapis_token'),
]
