
import logging
from django.conf import settings
from celery import shared_task
from portal.libs.agave.utils import user_account, service_account
from portal.libs.elasticsearch.utils import index_listing, index_project_listing
from portal.apps.users.utils import get_tas_allocations
from portal.apps.projects.models.metadata import ProjectMetadata
from portal.libs.elasticsearch.docs.base import (IndexedAllocation,
                                                 IndexedProject)
from portal.libs.elasticsearch.utils import get_sha256_hash
logger = logging.getLogger(__name__)


# Crawl and index agave files
@shared_task(bind=True, max_retries=3, queue='indexing', retry_backoff=True, rate_limit="12/m")
def tapis_indexer(self, systemId, access_token=None, filePath='/', recurse=True, update_pems=False, ignore_hidden=True, reindex=False):

    if next((sys for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS
            if sys.get('scheme', None) == 'projects'
            and sys.get('hideSearchBar', None)
            and systemId.startswith(settings.PORTAL_PROJECTS_SYSTEM_PREFIX)), None):
        return

    from portal.libs.elasticsearch.utils import index_level
    from portal.libs.agave.utils import walk_levels

    client = user_account(access_token) if access_token else service_account()

    if not filePath.startswith('/'):
        filePath = '/' + filePath

    try:
        filePath, folders, files = walk_levels(client, systemId, filePath, ignore_hidden=ignore_hidden).__next__()
        index_level(filePath, folders, files, systemId, reindex=reindex)
    except Exception as exc:
        logger.error("Error walking files under system {} and path {}".format(systemId, filePath))
        raise self.retry(exc=exc)

    if recurse:
        for child in folders:
            self.delay(systemId, filePath=child.get('path'), reindex=reindex)


@shared_task(bind=True, max_retries=3, queue='default')
def tapis_listing_indexer(self, listing):
    index_listing(listing)


@shared_task(bind=True, queue='indexing')
def index_community_data(self, reindex=False):
    for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS:
        if sys['api'] == 'tapis' and sys['scheme'] in ['community', 'public']:
            logger.info('INDEXING {} SYSTEM with file path {}'.format(sys['name'], sys.get("homeDir", "/")))
            tapis_indexer.apply_async(args=[sys['system']], kwargs={'filePath': sys.get("homeDir", "/"), 'reindex': reindex})


@shared_task(bind=True, max_retries=3, queue='api')
def index_allocations(self, username):
    allocations = get_tas_allocations(username)
    doc = IndexedAllocation(username=username, value=allocations)
    doc.meta.id = get_sha256_hash(username)
    doc.save()


@shared_task(bind=True, max_retries=3, queue='indexing')
def index_project(self, project_id):
    project = ProjectMetadata.objects.get(project_id=project_id)
    project_dict = project.to_dict()
    project_doc = IndexedProject(**project_dict)
    project_doc.meta.id = project_id
    project_doc.save()


@shared_task(bind=True, max_retries=3, queue='default')
def tapis_project_listing_indexer(self, projects):
    index_project_listing(projects)
