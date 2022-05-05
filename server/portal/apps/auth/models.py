"""Auth models
"""
import logging
import time
import requests
from requests import HTTPError
from django.db import models
from django.conf import settings
from agavepy.agave import Agave
from agavepy import agave

logger = logging.getLogger(__name__)


TOKEN_EXPIRY_THRESHOLD = 600
AGAVE_RESOURCES = agave.load_resource(getattr(settings, 'AGAVE_TENANT_BASEURL'))


class AgaveOAuthToken(models.Model):
    """Represents an agave OAuth Token object.

    Use this class to store login details as well as refresh a token.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, related_name='agave_oauth', on_delete=models.CASCADE)
    token_type = models.CharField(max_length=255)
    scope = models.CharField(max_length=255)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
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
        """Map the agavepy.Token property to model property

        :return: The Epoch timestamp this token was created
        :rtype: int
        """
        return self.created_at

    @created_at.setter
    def created_at(self, value):
        """Map the agavepy.Token property to model property

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
        for key, val in kwargs.items():
            setattr(self, key, val)
        self.save()

    def __str__(self):
        return '<{} - {}>'.format(self.user.username, self.token_type)

    def __repr__(self):
        return 'AgaveOAuthToken(user={},token_type={},...)'.\
               format(self.user.username, self.token_type)


class AgaveServiceStatus(object):
    page_id = getattr(settings, 'AGAVE_STATUSIO_PAGE_ID', '53a1e022814a437c5a000781')
    status_io_base_url = getattr(settings, 'STATUSIO_BASE_URL',
                                 'https://api.status.io/1.0')
    status_overall = {}
    status = []
    incidents = []
    maintenance = {
        'active': [],
        'upcoming': [],
    }

    def __init__(self):
        self.update()

    def update(self):
        try:
            resp = requests.get('%s/status/%s' % (self.status_io_base_url, self.page_id))
            data = resp.json()
            if 'result' in data:
                for k, v, in data['result'].items():
                    setattr(self, k, v)
            else:
                raise Exception(data)
        except HTTPError:
            logger.warning('Agave Service Status update failed')
