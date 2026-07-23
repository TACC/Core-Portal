"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
from portal.apps import SCHEMA_MAPPING
from collections import OrderedDict

class Link(models.Model):
    tapis_uri = models.TextField(primary_key=True)
    postit_url = models.TextField()
    updated = models.DateTimeField(auto_now=True)
    expiration = models.DateTimeField(null=True)

    def get_uuid(self):
        return self.postit_url.split('/')[-1]

    def to_dict(self):
        return {
            'tapis_uri': self.agave_uri,
            'postit_url': self.postit_url,
            'updated': str(self.updated),
            'expiration': str(self.expiration)
        }

class DataFilesMetadata(models.Model):
    name = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    path = models.CharField(max_length=1024, unique=True)
    project = models.ForeignKey('projects.ProjectsMetadata', on_delete=models.CASCADE, related_name='data_files')
    created_at = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)

    @property
    def ordered_metadata(self):
        """Return the metadata in the order defined in the pydantic model"""
        
        portal_name = settings.PORTAL_NAMESPACE
        schema = SCHEMA_MAPPING[self.metadata.get('data_type')] 

        if not schema:
            return self.metadata
        
        model_keys = list(schema.model_fields.keys())
        ordered_metadata = {k: self.metadata.get(k) for k in model_keys if k in self.metadata}

        return ordered_metadata

    def __str__(self):
        return self.path
    
@receiver(pre_save, sender=DataFilesMetadata)
def set_or_udpate_parent(sender, instance, **kwargs):
    # if new record or the path of the instance is different 
    if not instance.pk or instance.path != sender.objects.get(pk=instance.pk).path:
        parent_path = instance.path.rsplit('/', 1)[0]  # Extract the parent path
        if len(parent_path.split('/')) > 1:
            parent_folder = sender.objects.get(path=parent_path)
            instance.parent = parent_folder
        else: 
            instance.parent = None
