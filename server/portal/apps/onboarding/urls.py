"""
.. module:: portal.apps.onboarding.urls
   :synopsis: Onboarding URLs
"""
from django.urls import re_path
from portal.apps.onboarding import views

app_name = 'portal_onboarding'
urlpatterns = [
    re_path('',  view=views.onboarding, name='holding'),
]
