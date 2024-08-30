"""Publications model.

.. :module:: portal.apps.publications.models
   :synopsis: Metadata model for publications.
"""
import logging
from django.conf import settings
from django.db import models
from django.utils import timezone

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class PublicationRequest(models.Model):

    class Status(models.TextChoices):
        PENDING = 'PENDING'
        APPROVED = 'APPROVED'
        REJECTED = 'REJECTED'

    review_project = models.ForeignKey('projects.ProjectsMetadata', related_name='publication_reviews', on_delete=models.SET_NULL, null=True)
    source_project = models.ForeignKey('projects.ProjectsMetadata', related_name='source_publication_reviews', on_delete=models.CASCADE)
    reviewers = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='publication_reviewers')
    status = models.CharField(max_length=255, choices=Status.choices, default=Status.PENDING)
    comments = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Review for {self.project.project_id}'