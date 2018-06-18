import logging
import os
from django.conf import settings
from django.contrib.auth.models import User
from celery import shared_task
from agavepy.agave import Agave
from elasticsearch_dsl import Q, Search
from portal.libs.elasticsearch.docs.base import IndexedFile
logger = logging.getLogger(__name__)

# Crawl and index agave files
@shared_task(queue='indexing', rate_limit="50/m", time_limit=60)
def agave_indexer(systemId, username=None, filePath='/', recurse=True):
    try:
        # Get a listing and index the results.
        if username != None:
            # get user object from agave.
            u = User.objects.get(username=username)
            client = u.agave_oauth.client
        else:
            client = Agave(api_server=settings.AGAVE_TENANT_BASEURL, token=settings.AGAVE_SUPER_TOKEN)
        listing = client.files.list(systemId=systemId, filePath=filePath)
        for child in listing[1:]:
            f = IndexedFile(**child)
            f.save()
            # Recurse on any dirs.
            if recurse and child['mimeType'] == 'text/directory' and not child.name.startswith('.'):
                try:
                    agave_indexer.apply_async(
                        args=(systemId, ),
                        kwargs={"filePath": child.path, "username": username}
                    )
                except Exception as e:
                    logger.info(e)
    except:
        logger.info("Error, could not index {system}:{path}".format(system=systemId, path=filePath))

@shared_task
def index_community_data():
    s = IndexedFile.search()
    s = s.query("match", **{"system._exact": settings.AGAVE_COMMUNITY_DATA_SYSTEM})
    resp = s.delete()
    agave_indexer.apply_async(args=[settings.AGAVE_COMMUNITY_DATA_SYSTEM])

# Indexing task for My Data.
@shared_task
def index_my_data():
    users = User.objects.all()
    for user in users:
        uname = user.username
        systemId = "data-tacc-work-" + uname
        s = IndexedFile.search()
        s = s.query("match", **{"system._exact": systemId})
        resp = s.delete()
        agave_indexer.apply_async(
            args=[systemId],
            kwargs={'username': uname, 'filePath': '/'}
        )
