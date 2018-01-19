from __future__ import unicode_literals

import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.utils.translation import ugettext_lazy as _

# Create your models here.


#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


class PortalProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='profile')
    ethnicity = models.CharField(max_length=255)
    gender = models.CharField(max_length=255)

    def send_mail(self, subject, body=None):
        send_mail(subject,
                  body,
                  settings.DEFAULT_FROM_EMAIL,
                  [self.user.email],
                  html_message=body)


class NotificationPreferences(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                related_name='notification_preferences')
    announcements = models.BooleanField(
        default=True,
        verbose_name=_('Receive occasional announcements from DesignSafe'))

    class Meta:
        permissions = (
            ('view_notification_subscribers', 'Can view list of users subscribed to a '
                                              'notification type'),
        )


class PortalProfileNHInterests(models.Model):
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description


class PortalProfileResearchActivities(models.Model):
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description
