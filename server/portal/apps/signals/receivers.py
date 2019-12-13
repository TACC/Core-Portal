from django.dispatch import receiver
from django.core.serializers.json import DjangoJSONEncoder
from portal.apps.signals.signals import portal_event
from django.db.models.signals import post_save
from ws4redis.publisher import RedisPublisher
from ws4redis.redis_store import RedisMessage
from portal.apps.notifications.models import Notification
from portal.apps.onboarding.models import SetupEvent
from django.contrib.auth import get_user_model
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


@receiver(post_save, sender=SetupEvent, dispatch_uid='setup_event')
def send_setup_event(sender, instance, created, **kwargs):
    # Only send the event if it is being saved. (Creation also triggers post_save)
    if created:
        return

    logger.debug("Sending setup event through websocket")
    setup_event = instance

    # All staff will receive websocket notifications so they can see
    # setup event updates for users they are administering
    receiving_users = get_user_model().objects.all().filter(is_staff=True)
    receiving_users = [user for user in receiving_users]
    # Add the setup_event's user to the notification list
    receiving_users.append(setup_event.user)
    try:
        rp = RedisPublisher(facility=WEBSOCKETS_FACILITY, users=receiving_users)
        data = {
            "event_type": "setup_event",
            "setup_event": setup_event.to_dict()
        }
        msg = RedisMessage(json.dumps(data))

        # Short expiry. Users viewing onboarding status changes should receive
        # "live" messages. Users viewing the page after an event happens
        # should be able to retrieve setup state without needing live
        # notifications. This also prevents staff from accumulating messages
        # for all users.
        rp.publish_message(msg, expire=10)

    except Exception:
        logger.debug(
            'Exception sending websocket message',
            exc_info=True,
            extra=setup_event.to_dict()
        )
    return
