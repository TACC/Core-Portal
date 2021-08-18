
import logging
from django.conf import settings
from django.contrib.auth.models import User
# from django.core.management import call_command
from celery import shared_task
from portal.libs.agave.utils import service_account
from portal.libs.elasticsearch.utils import index_listing
from portal.apps.users.utils import get_tas_allocations
from portal.apps.projects.models.metadata import ProjectMetadata
from portal.libs.elasticsearch.docs.base import (IndexedAllocation,
                                                 IndexedProject)
from portal.libs.elasticsearch.utils import get_sha256_hash
logger = logging.getLogger(__name__)


# Crawl and index agave files
@shared_task(bind=True, max_retries=3, queue='indexing', retry_backoff=True, rate_limit="12/m")
def agave_indexer(self, systemId, filePath='/', recurse=True, update_pems=False, ignore_hidden=True, reindex=False):

    from portal.libs.elasticsearch.utils import index_level
    from portal.libs.agave.utils import walk_levels

    client = service_account()

    if not filePath.startswith('/'):
        filePath = '/' + filePath

    try:
        filePath, folders, files = walk_levels(client, systemId, filePath, ignore_hidden=ignore_hidden).__next__()
    except Exception as exc:
        logger.error("Error walking files under system {} and path {}".format(systemId, filePath))
        raise self.retry(exc=exc)

    index_level(filePath, folders, files, systemId, reindex=reindex)
    if recurse:
        for child in folders:
            self.delay(systemId, filePath=child.path, reindex=reindex)


@shared_task(bind=True, max_retries=3, queue='default')
def agave_listing_indexer(self, listing):
    index_listing(listing)


@shared_task(bind=True, queue='indexing')
def index_community_data(self, reindex=False):
    # s = IndexedFile.search()
    # s = s.query("match", **{"system._exact": settings.AGAVE_COMMUNITY_DATA_SYSTEM})
    # resp = s.delete()
    for sys in settings.PORTAL_DATAFILES_STORAGE_SYSTEMS:
        if sys.api == 'tapis':
            logger.info('INDEXING {} SYSTEM'.format(sys.name))
            agave_indexer.apply_async(args=[sys.system], kwargs={'reindex': reindex})


@shared_task(bind=True, max_retries=3, queue='default')
def project_indexer(self, listing):
    pass

# @shared_task(bind=True, queue='indexing')
# def project_indexer(self, projectId):
#     """
#     Background task to index a single project given its ID
#     """
#     index_project(projectId)

# @shared_task(bind=True, queue='indexing')
# def index_all_projects(self):
#     """
#     Retrieve all project metadata records from the database and index them
#     """
#     project_records = ProjectMetadata.objects.all()
#     for project in project_records:
#         project_indexer.apply_async(args=[project.project_id])

# @shared_task(bind=True, queue='indexing')
# def index_project_files(self, reindex=False):
#     """
#     Index all storage systems associated with projects.
#     """
#     project_records = ProjectMetadata.objects.all()
#     for project in project_records:
#         projectId = project.project_id
#         uname = project.owner.username
#         systemId = project_id_to_system_id(projectId)
#         agave_indexer.apply_async(
#             args=[systemId],
#             kwargs={'filePath': '/', 'reindex': reindex}
#         )


# Indexing task for My Data.
# @shared_task(bind=True, queue='indexing')
# def index_my_data(self, reindex=False):
#     users = User.objects.all()
#     for user in users:
#         uname = user.username
#         default_sys = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEM_DEFAULT
#         default_system_prefix = settings.PORTAL_DATA_DEPOT_LOCAL_STORAGE_SYSTEMS[default_sys]['prefix']
#         systemId = default_system_prefix.format(uname)

#         # s = IndexedFile.search()
#         # s = s.query("match", **{"system._exact": systemId})
#         # resp = s.delete()
#         agave_indexer.apply_async(
#             args=[systemId],
#             kwargs={'filePath': '/', 'reindex': reindex}
#         )


# @shared_task(bind=True, queue='indexing')
# def index_cms(self):
#     logger.info("Updating search index")
#     if not settings.DEBUG:
#         call_command("update_index", interactive=False)


@shared_task(bind=True, max_retries=3, queue='api')
def index_allocations(self, username):
    allocations = get_tas_allocations(username)
    doc = IndexedAllocation(username=username, value=allocations)
    doc.meta.id = get_sha256_hash(username)
    doc.save()
    """
    try:
            doc = IndexedAllocation.from_username(username)
            doc.update(value=allocations)
    except NotFoundError:
            doc = IndexedAllocation(username=username, value=allocations)
            doc.save()
    """


@shared_task(bind=True, max_retries=3, queue='indexing')
def index_project(self, project_id):
    project = ProjectMetadata.objects.get(project_id=project_id)
    project_dict = project.to_dict()
    project_doc = IndexedProject(**project_dict)
    project_doc.meta.id = project_id
    project_doc.save()
