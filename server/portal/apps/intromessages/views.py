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
            db_message = IntroMessages.objects.filter(user=request.user, component=component_name).values()
            # if the IntroMessage exists
            if db_message:
                if db_message[0]['unread'] != component_value['unread']:
                    db_message[0]['unread'] = component_value['unread']
                    db_message_object = IntroMessages(user=request.user, id=db_message[0]['id'], component=component_name, unread=component_value['unread'])
                    db_message_object.mark_read()
            else:
                new_db_message = IntroMessages(user=request.user, component=component_name, unread=component_value['unread'])
                new_db_message.mark_read()
        return JsonResponse({'status': 'OK'})
