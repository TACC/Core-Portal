"""
.. module:: portal.apps.forms.urls
   :synopsis: Forms URLs
"""
from django.urls import re_path
from portal.apps._custom.drp.views import DigitalRocksSampleView 

app_name = 'custom'
urlpatterns = [
    re_path('', DigitalRocksSampleView.as_view(), name='drp'),
]
