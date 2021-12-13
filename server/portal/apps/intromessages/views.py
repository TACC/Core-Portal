"""
.. :module: apps.intromessages.views
   :synopsis: Views to handle read/unread status of IntroMessages
"""

import logging
from portal.views.base import BaseApiView
from django.http import JsonResponse
from portal.apps.intromessages.models import IntroMessages
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
import json


logger = logging.getLogger(__name__)


@method_decorator(login_required, name='dispatch')
class IntroMessagesView(BaseApiView):
    def get(self, request, *args, **kwargs):
        messages_array = IntroMessages.objects.filter(user=request.user).values('component', 'unread')
        return JsonResponse({'response': list(messages_array)})

    def put(self, request, *args):
        body = json.loads(request.body)
        for component_name, component_value in body.items():
            try:
                db_message = IntroMessages.objects.get(user=request.user, component=component_name)
                # if the IntroMessage exists
                if db_message and db_message.unread != component_value:
                    db_message.unread = component_value
                    db_message.save()
            except IntroMessages.DoesNotExist:
                new_db_message = IntroMessages.objects.create(user=request.user, component=component_name, unread=component_value)
                new_db_message.save()
        return JsonResponse({'status': 'OK'})
