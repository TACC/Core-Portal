from __future__ import absolute_import
import logging
import urllib
import os
from django.conf import settings
from django.contrib.auth.models import User
from django.core.management import call_command
from celery import shared_task
from agavepy.agave import Agave
from elasticsearch_dsl import Q, Search
from portal.libs.elasticsearch.docs.base import IndexedFile
from portal.libs.elasticsearch.exceptions import DocumentNotFound
from portal.libs.elasticsearch.docs.files import BaseESFile
from portal.libs.elasticsearch.utils import index_agave
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.utils import service_account
logger = logging.getLogger(__name__)

# Crawl and index agave files
@shared_task(bind=True, max_retries=3, queue='indexing', retry_backoff=True, rate_limit="1/s")
def agave_indexer(self, systemId, username=None, filePath='/', recurse=True, update_pems = False, ignore_hidden=True, reindex=False):

    # prevent recursive indexing until we can do it without thrashing Agave
    recurse = False

    from portal.libs.elasticsearch.utils import index_level
    from portal.libs.agave.utils import walk_levels

    if username != None:
        pems_username = username
    else:
        pems_username = settings.PORTAL_ADMIN_USERNAME
    client = service_account()

    if filePath[0] != '/':
        filePath = '/' + filePath 

    try:
        filePath, folders, files = walk_levels(client, systemId, filePath, ignore_hidden=ignore_hidden).next()
    except Exception as exc:
        logger.debug(exc)
        raise self.retry(exc=exc)

    index_level(filePath, folders, files, systemId, pems_username, reindex=reindex)
    if recurse:
        for child in folders:
            self.delay(systemId, filePath=child.path, reindex=reindex)

@shared_task(bind=True, queue='indexing')
def index_community_data(self, reindex=False):
    # s = IndexedFile.search()
    # s = s.query("match", **{"system._exact": settings.AGAVE_COMMUNITY_DATA_SYSTEM})
    # resp = s.delete()
    agave_indexer.apply_async(args=[settings.AGAVE_COMMUNITY_DATA_SYSTEM], kwargs={'reindex': reindex})

# Indexing task for My Data.
@shared_task(bind=True, queue='indexing')
def index_my_data(self, reindex=False):
    users = User.objects.all()
    for user in users:
        uname = user.username
        systemId = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(uname)
        # s = IndexedFile.search()
        # s = s.query("match", **{"system._exact": systemId})
        # resp = s.delete()
        agave_indexer.apply_async(
            args=[systemId],
            kwargs={'username': uname, 'filePath': '/', 'reindex': reindex}
        )

@shared_task(bind=True, queue='indexing')
def index_cms(self):
    logger.info("Updating search index")
    if not settings.DEBUG:
        call_command("rebuild_index", interactive=False)
