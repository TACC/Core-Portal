"""
.. module:: portal.apps.forms.urls
   :synopsis: Forms URLs
"""
from django.urls import re_path
from portal.apps._custom.drp.views import DigitalRocksSampleView, DigitalRocksTreeView, GenerateImagesView

app_name = 'custom'
urlpatterns = [
    re_path('^$', DigitalRocksSampleView.as_view(), name='drp'),
    re_path('tree/', DigitalRocksTreeView.as_view(), name='tree'),
    re_path('generate-images/', GenerateImagesView.as_view(), name='generate_images')
]
