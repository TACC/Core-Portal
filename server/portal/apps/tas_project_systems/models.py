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
    projectname = models.CharField(
        help_text='The project name',
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
        blank=False,
        choices=[(template_name, template_name) for template_name in dict.keys(settings.PORTAL_TAS_PROJECT_SYSTEMS_TEMPLATES)]
    )


    def __str__(self):
        return f"{self.projectname} ({self.project_sql_id})"
