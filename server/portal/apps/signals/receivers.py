from django.dispatch import receiver
from django.core.serializers.json import DjangoJSONEncoder
from portal.apps.signals.signals import portal_event
from django.db.models.signals import post_save
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
from portal.apps.notifications.models import Notification
import json
import logging
import copy

logger = logging.getLogger(__name__)
WEBSOCKETS_FACILITY = 'notifications'


@receiver(portal_event, dispatch_uid=__name__)
def portal_event_callback(sender, **kwargs):
    users = kwargs.get('event_users', [])

    data = copy.copy(kwargs)

    data.pop('signal')

    if users:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, users=users)
    else:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, broadcast=True)
    msg = RedisMessage(json.dumps(data, cls=DjangoJSONEncoder))
    rp.publish_message(msg)


@receiver(post_save, sender=Notification, dispatch_uid='notification_msg')
def send_notification_ws(sender, instance, created, **kwargs):
    # Only send WS message if it's a new notification not if we're updating.
    logger.debug('receiver received something.')
    if not created:
        return
    try:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, users=[instance.user])
        # rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, broadcast=True)
#        logger.debug(instance.to_dict())
        instance_dict = json.dumps(instance.to_dict())
        logger.info(instance_dict)
        msg = RedisMessage(instance_dict)
        rp.publish_message(msg)
#        logger.debug('WS socket msg sent: {}'.format(instance_dict))
    except Exception:
        logger.debug('Exception sending websocket message',
                     exc_info=True,
                     extra=instance.to_dict())
    return
