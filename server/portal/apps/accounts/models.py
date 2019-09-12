"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db import models


# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class PortalProfile(models.Model):
    """Profile Model

    Extending the user model to store extra data
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name='profile'
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
