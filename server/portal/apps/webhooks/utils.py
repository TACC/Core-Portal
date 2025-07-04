from portal.apps.webhooks.callback import WebhookCallback
from portal.apps.webhooks.models import ExternalCall
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
import random
import string
from inspect import isclass
from importlib import import_module
import logging

logger = logging.getLogger(__name__)


def get_webhook_id():
    chars = string.ascii_letters + string.digits
    return ''.join(random.choice(chars) for i in range(16))


def register_webhook(callback=None, callback_data=None, user=None):
    """register_webhook

    Create an instance of ExternalCall and return the associated callback URL
    """
    external_call = ExternalCall.objects.create(
        callback=callback,
        callback_data=callback_data,
        user=user,
        webhook_id=get_webhook_id()
    )
    return "{}/webhooks/callbacks/{}/".format(settings.WH_BASE_URL, external_call.webhook_id)


def validate_webhook(webhook_id):
    """validate_webhook

    Verify that the webhook is valid and still accepting requests

    :return An instance of ExternalCall, or None if there are none that are still accepting requests
    """
    try:
        return ExternalCall.objects.get(webhook_id=webhook_id, accepting=True)
    except ObjectDoesNotExist:
        return None


def load_callback(callback_name):
    """load_callback

    """
    module_str, callable_str = callback_name.rsplit('.', 1)
    module = import_module(module_str)
    call = getattr(module, callable_str)
    if not isclass(call):
        raise ValueError(
            "{callback_name} is not a class".format(
                callback_name=callback_name
            )
        )
    callback_instance = call()
    if not isinstance(callback_instance, WebhookCallback):
        raise ValueError(
            "{callback_name} is not a subclass of WebhookCallback".format(
                callback_name=callback_name
            )
        )
    return callback_instance


def execute_callback(external_call, request):
    """execute_callback

    Execute the associated callback of a webhook
    """
    if external_call.callback is None or external_call.callback == "":
        return
    callback = load_callback(external_call.callback)
    callback.callback(external_call, request)
