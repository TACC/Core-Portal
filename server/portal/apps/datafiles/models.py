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
    agave_uri = models.TextField(primary_key=True)
    postit_url = models.TextField()
    updated = models.DateTimeField(auto_now=True)

    def get_nonce(self):
        return self.postit_url.split('/')[-1]

    def to_dict(self):
        return {
            'agave_uri': self.agave_uri,
            'postit_url': self.postit_url,
            'updated': str(self.updated),
        }
