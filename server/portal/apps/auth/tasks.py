from portal.apps.accounts.models import PortalProfile
from celery import shared_task
import logging
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=None)
def setup_user(self, username):
    """Setup workflow for each user

        Called asynchronously from portal.apps.auth.views.agave_oauth_callback
    """
    user = get_user_model().objects.get(username=username)
    profile = PortalProfile.objects.get(user=user)
    profile.setup_complete = True
    profile.save()
    from portal.apps.accounts.managers.accounts import setup
    logger.info("Async setup task for {username} launched".format(username=username))
    setup(username)
