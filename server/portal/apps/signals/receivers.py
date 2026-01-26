from django.dispatch import receiver
from portal.apps.signals.signals import portal_event
from django.db.models.signals import post_save
from portal.apps.notifications.models import Notification
from portal.apps.onboarding.models import SetupEvent
from portal.apps.projects.models.metadata import LegacyProjectMetadata
from portal.apps.search.tasks import index_project
from django.contrib.auth import get_user_model
import logging
import copy
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
channel_layer = get_channel_layer()

logger = logging.getLogger(__name__)


@receiver(portal_event, dispatch_uid=__name__)
def portal_event_callback(sender, **kwargs):
    logger.debug("Received a generic portal event")
    users = kwargs.get('event_users', [])

    data = copy.copy(kwargs)

    data.pop('signal')

    if users:
        for user in users:
            async_to_sync(channel_layer.group_send)(
                user.username,
                {
                    'type': 'portal_notification',
                    'body': data
                }
            )
    else:
        async_to_sync(channel_layer.group_send)(
            'portal_events',
            {
                'type': 'portal_notification',
                'body': data
            }
        )


@receiver(post_save, sender=Notification, dispatch_uid='notification_msg')
def send_notification_ws(sender, instance, created, **kwargs):
    # Only send WS message if it's a new notification not if we're updating.
    logger.info("Received a Notification event")
    if not created:
        return
    try:
        instance_dict = instance.to_dict()
        logger.info(instance_dict)
        async_to_sync(channel_layer.group_send)(
            instance.user,
            {
                'type': 'portal_notification',
                'body': instance_dict
            }
        )
    except Exception:
        logger.exception(
            'Exception sending message to channel: portal_notification',
            extra=instance.to_dict())
    return


@receiver(post_save, sender=LegacyProjectMetadata, dispatch_uid='index_project')
def index_project_on_save(sender, instance, created, **kwargs):
    index_project.apply_async(args=[instance.project_id])


@receiver(post_save, sender=SetupEvent, dispatch_uid='setup_event')
def send_setup_event(sender, instance, **kwargs):
    logger.info("Sending setup event through websocket")
    setup_event = instance

    # All staff will receive websocket notifications so they can see
    # setup event updates for users they are administering
    receiving_users = get_user_model().objects.all().filter(is_staff=True)
    receiving_users = [user for user in receiving_users]

    # Add the setup_event's user to the notification list
    receiving_users.append(setup_event.user)
    try:
        data = {
            "event_type": "setup_event",
            "setup_event": setup_event.to_dict()
        }
        for user in set(receiving_users):
            async_to_sync(channel_layer.group_send)(
                user.username,
                {
                    'type': 'portal_notification',
                    'body': data
                }
            )

    except Exception:
        logger.exception(
            'Exception sending message to channel: portal_notification',
            extra=setup_event.to_dict()
        )
    return
