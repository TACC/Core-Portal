"""
.. :module: apps.intromessages.views
   :synopsis: Views to handle read/unread status of IntroMessages
"""

import logging
from portal.views.base import BaseApiView
from django.http import JsonResponse
from portal.apps.intromessages.models import IntroMessages
import json
# Create your views here.


logger = logging.getLogger(__name__)



class IntroMessagesView(BaseApiView):
    def get(self, request, *args, **kwargs):
        logger.error(' ======>> START GET LOGGING <<=====')

        messages_array = IntroMessages.objects.filter(user=request.user).values('component', 'unread')
        messages = [{'component': message['component'], 'unread': message['unread']} for message in messages_array]
        
        logger.info('messages = ')
        logger.info(messages)
        logger.info(' ======>> -END- GET LOGGING <<=====')
        
        return JsonResponse({ 'response': messages})


    def put(self, request, *args):
        logger.error(' ======>> START PUT LOGGING <<=====')
        logger.info(request)
        body = json.loads(request.body)
        logger.info(body)

        db_messages_array = IntroMessages.objects.filter(user=request.user).values()
        logger.info('db_messages_array = ')
        logger.info(db_messages_array)

        for message in body:
            logger.info('body[message] = ' + message + ': ' + str(body[message]))
            logger.info('message = ' + message)
            if body[message] == False:
                logger.info('unread = ' + str(body[message]))
                logger.info('message = ' + message)
                logger.info('user = ' + str(request.user))
                message_found = False
                for db_message in db_messages_array:
                    logger.info('db_message[component] = ' + str(db_message['component']))
                    logger.info('message = ' + message)
                    if db_message['component'] == message:
                        message_found = True
                if not message_found:
                    component_object = IntroMessages(user=request.user, component=message, unread=False)
                    logger.info('component_object = ')
                    logger.info(component_object)
                    component_object.save()

        logger.error(' ======>> -END- PUT LOGGING <<=====')

        return JsonResponse({'status': 'OK' })