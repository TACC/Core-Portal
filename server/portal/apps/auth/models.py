"""Auth models
"""

import logging
import time
from urllib.parse import urlparse
from django.db import models
from django.conf import settings
from tapipy.tapis import Tapis

logger = logging.getLogger(__name__)


TOKEN_EXPIRY_THRESHOLD = 600

# Module-level cache of Tapis clients keyed by user_id. Each uWSGI worker process
# maintains its own cache in memory, so the first request per user per worker pays
# the initialization cost
_tapis_client_cache = {}


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
    def client(self) -> Tapis:
        """Tapis client.

        Note: `tenant_id` is derived from TAPIS_TENANT_BASEURL (e.g. 'https://portals.tapis.io'
        yields 'portals') and passed explicitly to the Tapis constructor. Without it,
        tapipy looks it up by fetching all tenants from the Tapis registry
        (GET /v3/sites + GET /v3/tenants) on every instantiation to derive tenant_id from
        base_url. We pass `tenant_id` to constructor to avoid those two extra network calls.

        :return: Tapis client using refresh token.
        :rtype: :class:Tapis
        """
        if self.user_id in _tapis_client_cache:
            return _tapis_client_cache[self.user_id]

        tenant_id = urlparse(getattr(settings, "TAPIS_TENANT_BASEURL")).hostname.split(
            "."
        )[0]

        client = Tapis(
            base_url=getattr(settings, "TAPIS_TENANT_BASEURL"),
            tenant_id=tenant_id,
            client_id=getattr(settings, "TAPIS_CLIENT_ID"),
            client_key=getattr(settings, "TAPIS_CLIENT_KEY"),
            access_token=self.access_token,
            refresh_token=self.refresh_token,
        )
        _tapis_client_cache[self.user_id] = client
        return client

    def update(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)
        self.save()

    def refresh_tokens(self):
        client = self.client
        client.refresh_tokens()
        self.update(
            created=int(time.time()),
            access_token=client.access_token.access_token,
            expires_in=client.access_token.expires_in().total_seconds(),
        )

    def __str__(self):
        access_token_masked = self.access_token[-5:]
        refresh_token_masked = self.refresh_token[-5:]
        return f'access_token:{access_token_masked} refresh_token:{refresh_token_masked} expires_in:{self.expires_in} created:{self.created}'
