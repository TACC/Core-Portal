"""Auth models
"""
import logging
import time
from django.db import models
from django.conf import settings
from tapipy.tapis import Tapis

logger = logging.getLogger(__name__)


TOKEN_EXPIRY_THRESHOLD = 600


class TapisOAuthToken(models.Model):
    """Represents an Tapis OAuth Token object.

    Use this class to store login details as well as refresh a token.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='tapis_oauth', on_delete=models.CASCADE)
    access_token = models.CharField(max_length=2048)
    refresh_token = models.CharField(max_length=2048)
    expires_in = models.BigIntegerField()
    created = models.BigIntegerField()

    @property
    def masked_token(self):
        """Masked token.

        :return: Masked token with only the last 8 digits visible.
        :rtype: str
        """
        return self.access_token[:8].ljust(len(self.access_token), '-')

    @property
    def expired(self):
        """Check if token is expired

        :return: True or False, depending if the token is expired.
        :rtype: bool
        """
        current_time = time.time()
        return self.created + self.expires_in - current_time - TOKEN_EXPIRY_THRESHOLD <= 0

    @property
    def created_at(self):
        """Map the tapipy.Token property to model property

        :return: The Epoch timestamp this token was created
        :rtype: int
        """
        return self.created_at

    @created_at.setter
    def created_at(self, value):
        """Map the tapipy.Token property to model property

        :param int value: The Epoch timestamp this token was created
        """
        self.created = value

    @property
    def token(self):
        """Token dictionary.

        :return: Full token object
        :rtype: dict
        """
        return {
            'access_token': self.access_token,
            'refresh_token': self.refresh_token,
            'created': self.created,
            'expires_in': self.expires_in
        }

    @property
    def client(self):
        """Tapis client.

        :return: Tapis client using refresh token.
        :rtype: :class:Tapis
        """
        return Tapis(base_url=getattr(settings, 'TAPIS_TENANT_BASE_URL'),
                     client_id=getattr(settings, 'TAPIS_CLIENT_ID'),
                     client_key=getattr(settings, 'TAPIS_CLIENT_KEY'),
                     access_token=self.access_token,
                     refresh_token=self.refresh_token)

    def update(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        self.save()
