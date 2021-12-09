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
    # Get all of the IntroMessages that have been read (unread = False)
    def get(self, request, *args, **kwargs):
        messages_array = IntroMessages.objects.filter(user=request.user).values('component', 'unread')
        # logger.info(messages_array)
        # messages = [{'component': message['component'], 'unread': message['unread']} for message in messages_array]
        # logger.info(messages)

        return JsonResponse({'response': list(messages_array)})

    # def put(self, request, *args):
    #     body = json.loads(request.body)
    #     # get all of the IntroMessages stored in the database
    #     db_messages = IntroMessages.objects.filter(user=request.user).values()
    #     for component_name, component_value in body.items():
    #         found = False
    #         for db_message in db_messages:          # Check to see if it's already stored in database
    #             if db_message['component'] == component_name:
    #                 found = True                    # Yes, does its unread status need to be updated in the database?
    #                 if db_message['unread'] != component_value['unread']:
    #                     db_message['unread'] = component_value['unread']
    #                     db_message_object = IntroMessages(user=request.user, id=db_message['id'], component=component_name, unread=component_value['unread'])
    #                     db_message_object.save()
    #         if not found:                           # No, so we need to store in database
    #             new_message_object = IntroMessages(user=request.user, component=component_name, unread=component_value['unread'])
    #             new_message_object.save()


    def put(self, request, *args):
        body = json.loads(request.body)
        # get all of the IntroMessages stored in the database
        db_messages = IntroMessages.objects.filter(user=request.user).values()
        for component_name, component_value in body.items():
            found = False
            for db_message in db_messages:          # Check to see if it's already stored in database
                if db_message['component'] == component_name:
                    found = True                    # Yes, does its unread status need to be updated in the database?
                    if db_message['unread'] != component_value['unread']:
                        db_message['unread'] = component_value['unread']
                        db_message_object = IntroMessages(user=request.user, id=db_message['id'], component=component_name, unread=component_value['unread'])
                        db_message_object.save()
            if not found:                           # No, so we need to store in database
                new_message_object = IntroMessages(user=request.user, component=component_name, unread=component_value['unread'])
                new_message_object.mark_read()

        return JsonResponse({'status': 'OK'})
