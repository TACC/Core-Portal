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
        return self.is_token_expired(self.created, self.expires_in)

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
        # Use new code path only if enabled.
        if settings.ENABLE_OPTIMIZED_OAUTH_REFRESH:
            return self.optimized_client()

        client = self.build_client()

        # replace atomic with db
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

    def optimized_client(self):
        """Tapis client to limit one request to Tapis per User.

        :return: Tapis client using refresh token.
        :rtype: :class:Tapis
        """
        client = self.build_client()
        if self.expired:
            logger.info('Tapis OAuth token expired')
            with transaction.atomic():
                # Get a lock on this user's token row in db.
                refreshed_token = TapisOAuthToken.objects.select_for_update().filter(user=self.user).first()
                if self.is_token_expired(refreshed_token.created, refreshed_token.expires_in):
                    try:
                        logger.info('Refreshing tapis oauth token')
                        client.refresh_tokens()
                    except Exception:
                        logger.exception('Tapis Token refresh failed')
                        raise

                    self.update(created=int(time.time()),
                                access_token=client.access_token.access_token,
                                expires_in=client.access_token.expires_in().total_seconds())
                else:
                    logger.info('Token updated by another request. Refreshing token from DB.')
                    # Token is no longer expired, refresh latest token info from DB and update client
                    self.refresh_from_db()
                    client = self.build_client()

        return client

    def build_client(self):
        return Tapis(
            base_url=getattr(settings, "TAPIS_TENANT_BASEURL"),
            client_id=getattr(settings, "TAPIS_CLIENT_ID"),
            client_key=getattr(settings, "TAPIS_CLIENT_KEY"),
            access_token=self.access_token,
            refresh_token=self.refresh_token,
        )

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

    @staticmethod
    def is_token_expired(created, expires_in):
        current_time = time.time()
        return created + expires_in - current_time - TOKEN_EXPIRY_THRESHOLD <= 0
