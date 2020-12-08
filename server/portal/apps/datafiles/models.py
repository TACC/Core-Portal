"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
from django.db import models


class PublicUrl(models.Model):
    agave_uri = models.TextField(primary_key=True)
    postit_url = models.TextField()
    updated = models.DateTimeField(auto_now=True)

    def get_uuid(self):
        return self.postit_url.split('/')[-1]

    def to_dict(self):
        return {
            'agave_uri': self.agave_uri,
            'postit_url': self.postit_url,
            'updated': str(self.updated),
        }
