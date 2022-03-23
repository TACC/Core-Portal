"""
.. :module: apps.intromessages.views
   :synopsis: Views to handle read/unread status of IntroMessages
"""

import logging
from portal.views.base import BaseApiView
from django.http import JsonResponse
from portal.apps.intromessages.models import IntroMessages, CustomMessages, CustomMessageTemplate
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
import json


logger = logging.getLogger(__name__)


def get_or_create_custom_messages(user, template_id):
    try:
        message = CustomMessages.objects.get(
            user=user,
            template_id=template_id
        )

    except CustomMessages.DoesNotExist:
        message = CustomMessages.objects.create(
            user=user,
            template_id=template_id
        )

    return {
        'template_id': message.template_id,
        'unread': message.unread,
    }

def cleanup_custom_messages(user, templates):
    user_messages = CustomMessages.objects.filter(user=user)
    template_ids = [int(template['id']) for template in templates]

    for user_message in user_messages:
        if int(user_message.template_id) not in template_ids:
            user_message.delete()


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


@method_decorator(login_required, name='dispatch')
class CustomMessagesView(BaseApiView):
    def get(self, request, *args, **kwargs):
        templates = CustomMessageTemplate.objects.all().values(
            'id',
            'component',
            'message_type',
            'dismissable',
            'message'
        )

        cleanup_custom_messages(request.user, templates)
        messages = [get_or_create_custom_messages(request.user, template['id']) for template in templates]

        return JsonResponse({
            'response': {
                'messages': list(messages),
                'templates': list(templates)
            }
        })

    def put(self, request, *args):
        body = json.loads(request.body)
        for msg in body['messages']:
            message = CustomMessages.objects.get(user=request.user, template_id=msg['template_id'])
            message.unread = msg['unread']
            message.save()
        return JsonResponse({'status': 'OK'})
