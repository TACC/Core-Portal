"""
.. :module: apps.portal_messages.views
   :synopsis: Views to handle read/unread status of IntroMessages
              and generate CustomMessages
"""

import logging
from portal.views.base import BaseApiView
from django.http import JsonResponse
from portal.apps.portal_messages.models import IntroMessages, CustomMessages, CustomMessageTemplate
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
import json


logger = logging.getLogger(__name__)


def get_or_create_custom_messages(user, template):
    message, _ = CustomMessages.objects.get_or_create(user=user, template=template)

    return {
        'template': message.template.to_dict(),
        'unread': message.unread,
    }


@method_decorator(login_required, name='dispatch')
class IntroMessagesView(BaseApiView):
    def get(self, request, *args, **kwargs):
        messages_array = IntroMessages.objects.filter(user=request.user).values('component', 'unread')
        return JsonResponse({'response': list(messages_array)})

    def put(self, request, *args):
        body = json.loads(request.body)
        for component_name, component_value in body.items():
            IntroMessages.objects.update_or_create(user=request.user, component=component_name, defaults={'unread': component_value})
        return JsonResponse({'status': 'OK'})


@method_decorator(login_required, name='dispatch')
class CustomMessagesView(BaseApiView):
    def get(self, request, *args, **kwargs):
        templates = CustomMessageTemplate.objects.all()
        messages = [get_or_create_custom_messages(request.user, template) for template in templates]

        return JsonResponse({
            'response': {
                'messages': list(messages),
            }
        })

    def put(self, request, *args):
        body = json.loads(request.body)
        template_id = body['templateId']
        unread = body['unread']
        message = CustomMessages.objects.get(user=request.user, template__id=template_id)
        message.unread = unread
        message.save()
        return JsonResponse({'status': 'OK'})
