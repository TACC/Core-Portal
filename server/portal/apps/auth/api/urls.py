from django.urls import re_path
from portal.apps.auth.api.views import TapisToken


app_name = 'auth_api'
urlpatterns = [
    re_path('tapis', TapisToken.as_view(), name='tapis_token'),
]
