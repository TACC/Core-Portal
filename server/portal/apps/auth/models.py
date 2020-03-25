"""Auth models
"""
from __future__ import unicode_literals

import logging
import time
import six
import requests
from requests import HTTPError
from django.db import models
from django.conf import settings
from agavepy.agave import Agave
from agavepy import agave

# Create your models here.

#pylint: disable=invalid-name
logger = logging.getLogger(__name__)
#pylint: enable=invalid-name


TOKEN_EXPIRY_THRESHOLD = 600
AGAVE_RESOURCES = agave.load_resource(getattr(settings, 'AGAVE_TENANT_BASEURL'))


class AgaveOAuthToken(models.Model):
    """Represents an agave OAuth Token object.

    Use this class to store login details as well as refresh a token.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='agave_oauth')
    token_type = models.CharField(max_length=255)
    scope = models.CharField(max_length=255)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    expires_in = models.BigIntegerField()
    created = models.BigIntegerField()

    @property
    def masked_token(self):
        """Masked token.

        :return: Masked token with only the first 8 digits visible.
        :rtype: str
        """
        return self.access_token[:8].ljust(len(self.access_token), b'-')

    @property
    def expired(self):
        """Check if token is expired

        :return: True or False, depending if the token is expired.
        :rtype: bool
        """
        current_time = time.time()
        return self.created + self.expires_in - current_time - TOKEN_EXPIRY_THRESHOLD <= 0

    @property
    def token(self):
        """Token dictionary.

        :return: Full token object
        :rtype: dict
        """
        return {
            'access_token': self.access_token,
            'refresh_token': self.refresh_token,
            'token_type': self.token_type,
            'scope': self.scope,
            'created': self.created,
            'expires_in': self.expires_in
        }

    @property
    def client(self):
        """Agave client.

        :return: Agave client using refresh token.
        :rtype: :class:Agave
        """
        return Agave(
            api_server=getattr(settings, 'AGAVE_TENANT_BASEURL'),
            api_key=getattr(settings, 'AGAVE_CLIENT_KEY'),
            api_secret=getattr(settings, 'AGAVE_CLIENT_SECRET'),
            token=self.access_token,
            resources=AGAVE_RESOURCES,
            refresh_token=self.refresh_token,
            token_callback=self.update,
            token_username=self.user.username
        )

    def update(self, **kwargs):
        """Update and save.
        """
        for key, val in six.iteritems(kwargs):
            setattr(self, key, val)
        self.save()

    def __unicode__(self):
        return '<{} - {}>'.format(self.user.username, self.token_type)

    def __str__(self):
        return self.__unicode__()

    def __repr__(self):
        return 'AgaveOAuthToken(user={},token_type={},...)'.\
               format(self.user.username, self.token_type)