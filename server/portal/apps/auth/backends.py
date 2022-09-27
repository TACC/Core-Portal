"""Auth backends"""
import logging
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from portal.apps.accounts.models import PortalProfile


logger = logging.getLogger(__name__)


class TapisOAuthBackend(ModelBackend):

    def authenticate(self, *args, **kwargs):
        user = None

        if 'backend' in kwargs and kwargs['backend'] == 'tapis':
            token = kwargs['token']

            logger.info('Attempting login via Tapis with token "%s"' %
                        token[:8].ljust(len(token), '-'))

            response = requests.get(f"{settings.TAPIS_TENANT_BASEURL}/v3/oauth2/userinfo", headers={"X-Tapis-Token": token})
            json_result = response.json()
            if 'status' in json_result and json_result['status'] == 'success':
                tapis_user = json_result['result']
                username = tapis_user['username']
                UserModel = get_user_model()
                try:
                    user = UserModel.objects.get(username=username)
                    user.first_name = tapis_user['given_name']
                    user.last_name = tapis_user['last_name']
                    user.email = tapis_user['email']
                    user.save()
                except UserModel.DoesNotExist:
                    logger.info('Creating local user record for "%s" '
                                'from Tapis Profile' % username)
                    user = UserModel.objects.create_user(
                        username=username,
                        first_name=tapis_user['given_name'],
                        last_name=tapis_user['last_name'],
                        email=tapis_user['email']
                    )

                try:
                    profile = PortalProfile.objects.get(user=user)
                except PortalProfile.DoesNotExist:
                    profile = PortalProfile(user=user)
                    profile.save()
                logger.info('Login successful for user "%s"' % username)
            else:
                logger.info('Tapis Authentication failed: %s' % json_result)
        return user
