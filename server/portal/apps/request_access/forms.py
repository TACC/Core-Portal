from django import forms
from django.conf import settings
from pytas.http import TASClient
import re
import logging

logger = logging.getLogger(__name__)

tas = TASClient(baseURL=settings.TAS_URL, credentials={'username': settings.TAS_CLIENT_KEY, 'password': settings.TAS_CLIENT_SECRET})

class RequestAccessForm(forms.Form):
    username = forms.CharField(label='TACC Username', required=True)
    password = forms.CharField(label='TACC Password', widget=forms.PasswordInput, required=True)
