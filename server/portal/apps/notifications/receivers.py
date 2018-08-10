from django.dispatch import receiver
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
from django.db.models.signals import post_save
from portal.apps.notifications.models import Notification
import logging
import json

logger = logging.getLogger(__name__)

WEBSOCKETS_FACILITY = 'notifications'

@receiver(post_save, sender=Notification, dispatch_uid='notification_msg')
def send_notification_ws(sender, instance, created, **kwargs):
    #Only send WS message if it's a new notification not if we're updating.
    logger.debug('receiver received something.')
    if not created:
        return
    try:
        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, users=[instance.user])
#        rp = RedisPublisher(facility = WEBSOCKETS_FACILITY, broadcast=True)
#        logger.debug(instance.to_dict())
        instance_dict = json.dumps(instance.to_dict())
        msg = RedisMessage(instance_dict)
        rp.publish_message(msg)
#        logger.debug('WS socket msg sent: {}'.format(instance_dict))
    except Exception as e:
        logger.debug('Exception sending websocket message',
                      exc_info=True,
                      extra = instance.to_dict())
        logger.debug('Exception sending websocket message',
                     exc_info=True)
    return
