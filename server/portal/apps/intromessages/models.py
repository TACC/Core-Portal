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

    def mark_read(self):
        self.save()

    # Make each type of IntroMessage unique
    class Meta:
        unique_together = ('user', 'component',)
