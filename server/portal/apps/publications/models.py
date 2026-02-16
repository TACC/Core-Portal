"""Publications model.

.. :module:: portal.apps.publications.models
   :synopsis: Metadata model for publications.
"""
import logging
from django.conf import settings
from django.db import models
from django.utils import timezone
from portal.apps.projects.models.project_metadata import ProjectMetadata
from django.core.serializers.json import DjangoJSONEncoder

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class PublicationRequest(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING'
        APPROVED = 'APPROVED'
        REJECTED = 'REJECTED'

    review_project = models.ForeignKey(ProjectMetadata, related_name='publication_reviews', on_delete=models.SET_NULL, null=True)
    source_project = models.ForeignKey(ProjectMetadata, related_name='source_publication_reviews', on_delete=models.CASCADE)
    reviewers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='publication_reviewers')
    status = models.CharField(max_length=255, choices=Status.choices, default=Status.PENDING)
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Review for {self.review_project.project_id}'
    
class Publication(models.Model):

    project_id = models.CharField(max_length=100, primary_key=True, editable=False)
    created = models.DateTimeField(default=timezone.now)
    is_published = models.BooleanField(default=True)
    last_updated = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)
    value = models.JSONField(
        encoder=DjangoJSONEncoder,
        help_text=(
            "Value for the project's base metadata, including title/description/users"
        ),
    )

    tree = models.JSONField(
        encoder=DjangoJSONEncoder,
        help_text=("JSON document containing the serialized publication tree"),
    )