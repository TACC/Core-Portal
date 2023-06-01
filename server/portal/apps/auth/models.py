"""Auth models
"""
import logging
import time
from django.db import models
from django.conf import settings
from tapipy.tapis import Tapis
from django.db import transaction

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
        client = Tapis(base_url=getattr(settings, 'TAPIS_TENANT_BASEURL'),
                       client_id=getattr(settings, 'TAPIS_CLIENT_ID'),
                       client_key=getattr(settings, 'TAPIS_CLIENT_KEY'),
                       access_token=self.access_token,
                       refresh_token=self.refresh_token)

        with transaction.atomic():
            if self.expired:
                try:
                    client.refresh_tokens()
                except Exception:
                    logger.exception('Tapis Token refresh failed')
                    raise

                self.update(created=int(time.time()),
                            access_token=client.access_token.access_token,
                            expires_in=client.access_token.expires_in().total_seconds())

        return client

    def update(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        self.save()

    def refresh_tokens(self):
        self.client.refresh_tokens()
        self.update(created=int(time.time()),
                    access_token=self.client.access_token.access_token,
                    expires_in=self.client.access_token.expires_in().total_seconds())

    def __str__(self):
        access_token_masked = self.access_token[-5:]
        refresh_token_masked = self.refresh_token[-5:]
        return f'access_token:{access_token_masked} refresh_token:{refresh_token_masked} expires_in:{self.expires_in} created:{self.created}'
