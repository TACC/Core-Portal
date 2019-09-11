from __future__ import absolute_import
from celery import shared_task
from requests import ConnectionError, HTTPError
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=None)
def setup_user(self, username):
    """Setup workflow for each user

        Called asynchronously from portal.apps.auth.views.agave_oauth_callback
    """
    from portal.apps.accounts.managers.accounts import setup
    logger.info("Async setup task for {username} launched".format(username=username))
    setup(username)
