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

    data = models.JSONField(null=True)

    # ID of job returned from Agave
    jobId = models.CharField(max_length=300)


class AppTrayCategory(models.Model):
    category = models.CharField(help_text='A category for the app tray', max_length=64)
    priority = models.IntegerField(help_text='Category priority, where higher priority tabs appear before lower ones', default=0)

    def __str__(self):
        return "%s" % (self.category)


class AppTrayEntry(models.Model):
    APP_TYPES = [('tapis', 'Tapis'), ('html', 'HTML')]
    label = models.CharField(help_text='The display name of this app in the App Tray', max_length=64, blank=True)
    icon = models.CharField(help_text='The icon to apply to this application', max_length=64, blank=True)
    version = models.CharField(help_text='The version number of the app', max_length=64, blank=True)
    appId = models.CharField(help_text='The id of this app. The app id + version denotes a unique app', max_length=64)
    appType = models.CharField(help_text='Application type', max_length=10, choices=APP_TYPES, default='tapis')
    html = models.TextField(help_text='HTML definition to display when Application is loaded',
                            default="", blank=True)
    available = models.BooleanField(help_text='App visibility in app tray', default=True)

    category = models.ForeignKey(
        AppTrayCategory,
        related_name="+",
        help_text="The App Category for this app entry",
        on_delete=models.CASCADE
    )

    def __str__(self):
        if self.appType == "html":
            return "%s: %s (HTML)" % (self.label, self.appId)
        return "%s%s%s" % (
            f"{self.label}: " if self.label else "",
            self.appId,
            f"-{self.version}" if self.version else ""
        )
