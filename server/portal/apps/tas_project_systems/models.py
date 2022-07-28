from django.db import models
from django.conf import settings


class TasProjectSystemEntry(models.Model):
    """TasProjectSystemEntry

    A model for tying a specific TAS project to a provisioned TAPIS system
    """
    project_sql_id = models.IntegerField(
        help_text='The TAS project ID to match for the user',
        blank=False
    )
    projectid = models.CharField(
        help_text='A projectid value to use for generating systems. Must be all lowercase, one word, no punctuation',
        max_length=32,
        blank=False
    )
    projectname = models.CharField(
        help_text='The project name for display and description purposes',
        max_length=64,
        blank=False
    )
    projectdir = models.CharField(
        help_text='The project directory to use within the system',
        max_length=64,
        blank=False
    )
    template = models.CharField(
        help_text='The template to use for creating TAPIS systems',
        max_length=64,
        blank=False
    )

    def __str__(self):
        return f"{self.projectname} ({self.project_sql_id}) - {self.template}"
