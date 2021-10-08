from django.db import models
from django.conf import settings

class IntroMessages(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        on_delete=models.CASCADE
    )

    account = models.BooleanField(default=True)
    allocations = models.BooleanField(default=True)
    applications = models.BooleanField(default=True)
    dashboard = models.BooleanField(default=True)
    data = models.BooleanField(default=True)
    history = models.BooleanField(default=True)
    tickets = models.BooleanField(default=True)


