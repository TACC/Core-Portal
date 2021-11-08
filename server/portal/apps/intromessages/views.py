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
        messages_array = IntroMessages.objects.filter(user=request.user).values('component', 'unread').values()
        messages = [{'component': message['component'], 'unread': message['unread']} for message in messages_array]
        return JsonResponse({ 'response': messages})


    def put(self, request, *args):
        body = json.loads(request.body)  
        logger.info(body)
        for component, unread_status in body.items():
            logger.info(component)
            logger.info(unread_status['unread'])
            if unread_status['unread'] == False:
                db_message = IntroMessages.objects.filter(user=request.user, component=component).values()
                if len(db_message) == 0:
                    new_message_object = IntroMessages(user=request.user, component=component, unread=unread_status['unread'])
                    new_message_object.save()

        return JsonResponse({'status': 'OK'})
