"""
.. :module:: apps.accounts.managers.models
   :synopsis: Account's models
"""
from __future__ import unicode_literals
import logging
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from django.core.exceptions import ObjectDoesNotExist
from django.core.serializers.json import DjangoJSONEncoder
from portal.utils import encryption as EncryptionUtil
from django.contrib.postgres.fields import JSONField

import json

class PublicUrl(models.Model):
    file_id = models.TextField(primary_key=True)
    postit_url = models.TextField()
    updated = models.DateTimeField()
    expires = models.DateTimeField()

    def to_dict(self):
        return {
            'file_id': self.file_id,
            'postit_url': self.postit_url,
            'updated': str(self.updated),
            'expires': str(self.expires)
        }
