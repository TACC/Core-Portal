"""
.. module:: portal.apps.forms.urls
   :synopsis: Forms URLs
"""
from django.urls import re_path
from portal.apps.forms.views import FormsView

app_name = 'workbench'
urlpatterns = [
    re_path('', FormsView.as_view(), name='form'),
]
