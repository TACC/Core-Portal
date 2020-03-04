from django.db import models
from django.conf import settings
from django.utils import timezone


class JobSubmission(models.Model):
    """Job Submission

    Used for tracking jobs that originate from this portal for filtering purposes
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+",
        on_delete=models.CASCADE
    )

    # Timestamp for event
    time = models.DateTimeField(default=timezone.now)

    # ID of job returned from Agave
    jobId = models.CharField(max_length=300)
