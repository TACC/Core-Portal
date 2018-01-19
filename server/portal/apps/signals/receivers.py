from django.dispatch import receiver
from django.core.serializers.json import DjangoJSONEncoder
from portal.apps.signals.signals import portal_event
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
import json
import logging
import copy

logger = logging.getLogger(__name__)


@receiver(portal_event, dispatch_uid = __name__)
def portal_event_callback(sender, **kwargs):
    WEBSOCKETS_FACILITY = 'notifications'
    event_type = kwargs.get('event_type', '')
    users = kwargs.get('event_users', [])

    data = copy.copy(kwargs)

    data.pop('signal')

    if users:
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, users=users)
    else:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, broadcast=True)
    msg = RedisMessage(json.dumps(data, cls=DjangoJSONEncoder))
    rp.publish_message(msg)
