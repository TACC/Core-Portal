from __future__ import absolute_import
from celery import shared_task
from requests import ConnectionError, HTTPError
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=None)
def setup_user(self, username):
    """Setup workflow for each user

    .. todo::
        As of 03/2018 this is the workflow:

        1. Create user's home directory
        2. Create user's home system
        3. Save ssh keys locally

        What else do we need to do here?
    """
    from portal.apps.accounts.managers import accounts
    accounts.setup(username)
