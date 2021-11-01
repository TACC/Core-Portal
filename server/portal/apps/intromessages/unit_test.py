from django.http import JsonResponse
from portal.apps.intromessages.views import IntroMessagesView
import json
import pytest
import logging


from portal.apps.intromessages.models import IntroMessages

def test_example():
    assert 1 == 1