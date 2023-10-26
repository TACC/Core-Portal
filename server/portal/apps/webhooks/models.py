from django.db import models
from django.conf import settings
from datetime import datetime
from django.utils import timezone


class ExternalCall(models.Model):
    """ExternalCall

    Used for tracking outbound calls
    """

    # Execution ID of the external call, must be present in callback URL
    webhook_id = models.CharField(max_length=16, primary_key=True)

    # Associated user for webhook events
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        on_delete=models.CASCADE,
        null=True
    )

    # Timestamp for outbound external call
    time = models.DateTimeField(default=timezone.now)

    # Callback class to be executed when a webhook is received
    callback = models.CharField(max_length=300, null=True)

    # JSON Data
    callback_data = models.JSONField(null=True)

    # If True, webhooks received will still be accepted.
    # Otherwise, a 500 will be returned to the caller.
    accepting = models.BooleanField(default=True)

    def __unicode__(self):
        return '{webhook_id} ({accepting})'.format(
            webhook_id=self.webhook_id,
            accepting="Accepting Webhooks" if self.accepting else "Not accepting webhooks"
        )

    def __str__(self):
        return self.__unicode__()

    def to_dict(self):
        return {
            "username": self.user.username,
            "time": str(self.time),
            "webhookId": self.webhookId,
        }
