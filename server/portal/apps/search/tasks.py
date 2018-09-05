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
from portal.libs.agave.models.files import BaseFile
from portal.libs.agave.utils import service_account
logger = logging.getLogger(__name__)

def delete_recursive(object_to_delete):
    ES_child_search = IndexedFile.search()\
        .filter(Q({'term': {'system._exact': object_to_delete.system}}))\
        .query(Q({'term': {'basePath._exact': object_to_delete.path}}))
    ES_children = ES_child_search.execute()

    for child in ES_children:
        delete_recursive(child)

    object_to_delete.delete()

# Crawl and index agave files
@shared_task(bind=True)
def agave_indexer(self, systemId, username=None, filePath='/', recurse=True, update_pems = False):
    try:
        # Get a listing and index the results.
        if username != None:
            # get user object from agave.
            u = User.objects.get(username=username)
            pems_username = username
            client = u.agave_oauth.client
        else:
            client = service_account()
            pems_username = settings.PORTAL_ADMIN_USERNAME

        file_root = BaseFile(client, systemId, filePath)

        children = file_root.children()
        for child in children:
            child_dict = child.to_dict()
       
            f = BaseESFile(pems_username, **child_dict)
            f_save = f.save()
            logger.debug(f_save)
            if f_save == True or update_pems:
                pems = child.pems_list()
                f._wrapped.update(**{'pems': pems})

            # Recurse on any dirs.
            if recurse and child.mimeType == 'text/directory' and not child.name.startswith('.'):
                try:
                    agave_indexer.apply_async(
                        args=(systemId, ),
                        kwargs={"filePath": child.path, "username": username}
                    )
                except Exception as e:
                    logger.info(e)

        basePath_search = IndexedFile.search()\
            .filter(Q({'term': {'system._exact': systemId}}))\
            .query(Q({'term': {'basePath._exact': filePath}}))
            
        listing_paths = [child.path for child in children]
        for result in basePath_search.execute():
            if result.path not in listing_paths:
                delete_recursive(result)

    except Exception as e:
        logger.info(e)
        logger.info("Error, could not index {system}:{path}".format(system=systemId, path=filePath))

@shared_task(bind=True)
def index_community_data(self):
    # s = IndexedFile.search()
    # s = s.query("match", **{"system._exact": settings.AGAVE_COMMUNITY_DATA_SYSTEM})
    # resp = s.delete()
    agave_indexer.apply_async(args=[settings.AGAVE_COMMUNITY_DATA_SYSTEM])

# Indexing task for My Data.
@shared_task(bind=True)
def index_my_data(self):
    users = User.objects.all()
    for user in users:
        uname = user.username
        systemId = settings.PORTAL_DATA_DEPOT_USER_SYSTEM_PREFIX.format(uname)
        # s = IndexedFile.search()
        # s = s.query("match", **{"system._exact": systemId})
        # resp = s.delete()
        agave_indexer.apply_async(
            args=[systemId],
            kwargs={'username': uname, 'filePath': '/'}
        )

@shared_task(bind=True)
def index_cms(self):
    logger.info("Updating search index")
    if not settings.DEBUG:
        call_command("rebuild_index", interactive=False)
