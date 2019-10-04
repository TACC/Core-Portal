"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
from __future__ import unicode_literals
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.utils.translation import ugettext_lazy as _

# Create your models here.


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class PortalProfile(models.Model):
    """Profile Model

    Extending the user model to store extra data
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='profile',
        on_delete=models.CASCADE
    )
    ethnicity = models.CharField(max_length=255)
    gender = models.CharField(max_length=255)

    # Default to False. If PORTAL_USER_ACCOUNT_SETUP_STEPS is empty,
    # setup_complete will be set to True on first login
    setup_complete = models.BooleanField(default=False)

    def send_mail(self, subject, body=None):
        """Send mail to user"""
        send_mail(subject,
                  body,
                  settings.DEFAULT_FROM_EMAIL,
                  [self.user.email],
                  html_message=body)


class NotificationPreferences(models.Model):
    """Notification Preferences

    .. todo: Should we have a `Preferences` model and store there
    all different kinds of preferences?
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL,
                                related_name='notification_preferences')
    announcements = models.BooleanField(
        default=True,
        verbose_name=_('Receive occasional announcements from {}'.format(settings.PORTAL_NAMESPACE)))

    class Meta:
        permissions = (
            ('view_notification_subscribers',
             'Can view list of users subscribed to a notification type'),
        )

    def __unicode__(self):
        return unicode(self.user)


class PortalProfileNHInterests(models.Model):
    """Portal Profile NH Interests"""
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description


class PortalProfileResearchActivities(models.Model):
    """Resesarch Activities"""
    description = models.CharField(max_length=300)

    def __unicode__(self):
        return self.description
