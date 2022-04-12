"""Auth backends"""
import logging
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from portal.apps.accounts.models import PortalProfile


logger = logging.getLogger(__name__)


class AgaveOAuthBackend(ModelBackend):

    def authenticate(self, *args, **kwargs):
        user = None

        if 'backend' in kwargs and kwargs['backend'] == 'agave':
            token = kwargs['token']
            base_url = getattr(settings, 'AGAVE_TENANT_BASEURL')

            logger.info('Attempting login via Agave with token "%s"' %
                        token[:8].ljust(len(token), '-'))

            # TODO make this into an AgavePy call
            response = requests.get('%s/profiles/v2/me' % base_url,
                                    headers={'Authorization': 'Bearer %s' % token})
            json_result = response.json()
            if 'status' in json_result and json_result['status'] == 'success':
                agave_user = json_result['result']
                username = agave_user['username']
                UserModel = get_user_model()
                try:
                    user = UserModel.objects.get(username=username)
                    user.first_name = agave_user['first_name']
                    user.last_name = agave_user['last_name']
                    user.email = agave_user['email']
                    user.save()
                except UserModel.DoesNotExist:
                    logger.info('Creating local user record for "%s" '
                                'from Agave Profile' % username)
                    user = UserModel.objects.create_user(
                        username=username,
                        first_name=agave_user['first_name'],
                        last_name=agave_user['last_name'],
                        email=agave_user['email']
                        )

                try:
                    profile = PortalProfile.objects.get(user=user)
                except PortalProfile.DoesNotExist:
                    profile = PortalProfile(user=user)
                    profile.save()
                logger.info('Login successful for user "%s"' % username)
            else:
                logger.info('Agave Authentication failed: %s' % json_result)
        return user
