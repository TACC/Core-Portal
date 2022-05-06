import logging
from django.db import models
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class IntroMessages(models.Model):
    """IntroMessages

    Used for storing the visited status of each of the Intro (formerly Welcome) messages.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        on_delete=models.CASCADE
    )

    datetime = models.DateTimeField(default=timezone.now, blank=True)

    # Each variable represents that intro message status
    # True means message has not been dismissed by user
    component = models.CharField(max_length=300, default='')
    unread = models.BooleanField(default=True)

    # Make each type of IntroMessage unique
    class Meta:
        unique_together = ('user', 'component',)


class CustomMessageTemplate(models.Model):
    """CustomMessageTemplate

    Used for storing admin-controlled messages for specific components that utilize CustomMessages.
    """

    MESSAGE_TYPES = [('info', 'Info'), ('success', 'Success'), \
                     ('warning', 'Warn'), ('error', 'Error')]

    COMPONENTS = [('DASHBOARD', 'Dashboard'), ('DATA', 'Data Files'), \
                  ('APPLICATIONS', 'Applications'), ('ALLOCATIONS', 'Allocations'), \
                  ('HISTORY', 'History'), ('UI', 'UI'), ('ACCOUNT', 'Account')]

    component = models.CharField(help_text='Component type', max_length=20, choices=COMPONENTS, default='Dashboard')
    message_type = models.CharField(help_text='Message type', max_length=20, choices=MESSAGE_TYPES, default='info')
    dismissible = models.BooleanField(default=True)
    message = models.CharField(help_text='Message content (max 200 characters)', max_length=200, default='', blank=True)

    def to_dict(self):
        return {
            'id': self.id,
            'component': self.component,
            'message_type': self.message_type,
            'dismissible': self.dismissible,
            'message': self.message
        }

    def __str__(self):
        return "%s-%s-%s-%s" % (self.message_type, self.component, \
                ('dismissible' if self.dismissible else 'not dismissible'), self.message[0:20])


class CustomMessages(models.Model):
    """CustomMessages

    Used for storing messages instances that were created by admin and handles status of each message.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        on_delete=models.CASCADE
    )

    template = models.ForeignKey(
        CustomMessageTemplate,
        related_name="+",
        on_delete=models.CASCADE,
    )

    unread = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'template',)

