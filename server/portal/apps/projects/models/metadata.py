"""Metadata model.

.. :module:: portal.apps.projects.models.metadata
   :synopsis: Metadata model for projects.
"""
import logging
from django.conf import settings
from django.db import models
from django.utils import timezone

# pylint: disable=invalid-name
logger = logging.getLogger(__name__)
# pylint: enable=invalid-name


class AbstractProjectMetadata(models.Model):
    """Abstract Project Metadata.

    This model will create an index on the field `project_id`.
    If you need to add more field to a project's metadata
    this model should be sub-classed. Also, if there's any
    common functionality we need to do for a project's metadata
    it should be implemented in this abstract model.

    .. note:: When sub-classing this abstract model and adding new
    fields, try to use default values for any new fields or overwrite
    `full_clean()` method. The `full_clean()` method is used when
    doing patches to this object.

    :param str title: Project title.
    :param str project_id: Project id.
    :param str description: Project's description.
    :param pi: Django user Many-to-One relation.
    :param co_pis: Django user Many-to-Many relation.
    :param team_members: Django user Many-to-Many relation.
    """
    title = models.TextField()
    project_id = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="rel_owner_%(class)s",
        related_query_name="owner_%(class)s",
        blank=True,
        null=True,
        on_delete=models.CASCADE
    )
    pi = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='rel_pi_%(class)s',
        related_query_name='pi_%(class)s',
        blank=True,
        null=True,
        on_delete=models.CASCADE
    )
    co_pis = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='rel_co_pi_%(class)s',
        related_query_name='co_pi_%(class)s',
        blank=True,
    )
    team_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='rel_member_%(class)s',
        related_query_name='member_%(class)s',
        blank=True,
    )

    def __str__(self):
        """Str -> self.prj_id - self.title."""
        return '{prj_id} - {title}'.format(
            prj_id=self.project_id,
            title=self.title
        )


class LegacyProjectMetadata(AbstractProjectMetadata):
    """Project Metadata"""

    def to_dict(self):
        from portal.apps.projects.serializers import MetadataJSONSerializer

        return MetadataJSONSerializer().default(self)

class ProjectsMetadata(models.Model):
    project_id = models.CharField(max_length=255, primary_key=True)
    metadata = models.JSONField(default=dict, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.project_id
    
    def get_metadata(self):
        reviews_as_review_project = self.publication_reviews.all()
        reviews_as_source_project = self.source_publication_reviews.all()

        # Format the reviews into a list of dictionaries
        reviews_data = [
            {
                'id': review.id,
                'status': review.status,
                'comments': review.comments,
                'reviewers': [
                    {
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                    }
                    for user in review.reviewers.all()],
                'created_at': review.created_at,
                'last_updated': review.last_updated
            }
            for review in (reviews_as_review_project | reviews_as_source_project)
        ]

        # Add the reviews data to the metadata
        updated_metadata = self.metadata.copy() if self.metadata else {}
        if reviews_data:
            updated_metadata['publication_requests'] = reviews_data
        
        return updated_metadata
