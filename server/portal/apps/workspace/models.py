from __future__ import unicode_literals

from django.db import models
from django.conf import settings
from datetime import datetime

# Create your models here.

class JobSubmission(models.Model):
    """Job Submission

    Used for tracking jobs that originate from this portal for filtering purposes
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="+"
    )

    # Timestamp for event
    time = models.DateTimeField(default=datetime.now)

    # ID of job returned from Agave
    jobId = models.CharField(max_length=300)