"""Auth backends"""
import logging
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from portal.apps.accounts.models import PortalProfile
from portal.apps.users.utils import get_user_data


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
                    user_data = get_user_data(username=username)
                    defaults = {
                        'first_name': user_data['firstName'],
                        'last_name': user_data['lastName'],
                        'email': user_data['email']
                    }
                except Exception:
                    logger.exception("Error retrieving TAS user profile data for user: {}".format(username))
                    defaults = {}

                user, created = UserModel.objects.update_or_create(username=username, defaults=defaults)

                if created:
                    logger.info('Created local user record for "%s" from TAS Profile' % username)

                PortalProfile.objects.get_or_create(user=user)
                logger.info('Login successful for user "%s"' % username)
            else:
                logger.info('Tapis Authentication failed: %s' % json_result)
        return user
