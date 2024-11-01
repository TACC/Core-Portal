from typing import Optional
from django.conf import settings
import logging
from portal.apps.projects.workspace_operations.shared_workspace_operations import create_publication_system
from portal.apps.projects.models.project_metadata import ProjectMetadata
import networkx as nx
from celery import shared_task

from portal.apps._custom.drp import constants
from portal.libs.agave.utils import user_account, service_account
from portal.apps.publications.models import Publication, PublicationRequest
from django.db import transaction
from tapipy.errors import NotFoundError, BaseTapyException

logger = logging.getLogger(__name__)

def _transfer_files(source_system_id, dest_system_id):
    client = service_account()

    source_system_files = client.files.listFiles(systemId=source_system_id, path='/')

    transfer_elements = [
        {
            'sourceURI': file.url,
            'destinationURI': f'tapis://{dest_system_id}/{file.path}'
        }
        for file in source_system_files
    ]

    transfer = client.files.createTransferTask(elements=transfer_elements)
    return transfer

def _check_transfer_status(service_client, transfer_task_id):
    transfer_details = service_client.files.getTransferTask(transferTaskId=transfer_task_id)
    return transfer_details.status


@shared_task(bind=True, queue='default')
def publish_project(self, project_id: str, version: Optional[int] = 1):
   
    review_system_prefix = settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX
    published_system_prefix = settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX

    published_workspace_id = f"{project_id}{f'v{version}' if version and version > 1 else ''}"
    published_system_id = f'{published_system_prefix}.{published_workspace_id}'
    review_system_id = f'{review_system_prefix}.{project_id}'

    with transaction.atomic():
    
        project_meta = ProjectMetadata.get_project_by_id(review_system_id)
        publication_tree: nx.DiGraph = nx.node_link_graph(project_meta.project_graph.value)

        published_project = ProjectMetadata.get_project_by_id(published_system_id)

        ProjectMetadata.objects.create(
            name=constants.PROJECT_GRAPH,
            base_project=published_project,
            value=nx.node_link_data(publication_tree),
        )

        doi = 'test_doi'  # Replace with actual DOI retrieval logic

        # Update project metadata with datacite doi
        source_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'
        source_project = ProjectMetadata.get_project_by_id(source_project_id)
        source_project.value['doi'] = doi
        source_project.save()

        pub_tree = nx.node_link_graph(published_project.project_graph.value)
        pub_tree.nodes["NODE_ROOT"]["version"] = version
        published_project.project_graph.value = nx.node_link_data(pub_tree)
        published_project.value['doi'] = doi
        published_project.save()


        pub_metadata = Publication.objects.update_or_create(
            project_id=project_id,
            defaults={"value": published_project.value, "tree": nx.node_link_data(pub_tree), "version": version},
        )

        # transfer files 
        transfer = _transfer_files(review_system_id, published_system_id)

        poll_tapis_file_transfer.apply_async(kwargs={
            'review_project_id': review_system_id,
            'published_project_id': published_system_id,
            'transfer_task_id': transfer.uuid
        }, countdown=30)


@transaction.atomic
def update_and_cleanup_review_project(review_project_id: str, status: PublicationRequest.Status):

    client = service_account()

    # update the publication request 
    review_project = ProjectMetadata.get_project_by_id(review_project_id)
    pub_request = PublicationRequest.objects.get(review_project=review_project, status=PublicationRequest.Status.PENDING)
    pub_request.status = status
    pub_request.save()

    logger.info(f'Updated publication request for review project {review_project_id} to {status}.')

    # delete the review project and data inside it
    client.files.delete(systemId=review_project_id, path='/')
    client.systems.deleteSystem(systemId=review_project_id)

    review_project_graph = ProjectMetadata.objects.get(name=constants.PROJECT_GRAPH, base_project=review_project)
    review_project_graph.delete()
    review_project.delete()

    logger.info(f'Deleted review project {review_project_id} and its associated data.')


@shared_task(bind=True, queue='default')
def poll_tapis_file_transfer(self, review_project_id, published_project_id, transfer_task_id):
    logger.info(f'Starting post transfer task for transfer id {transfer_task_id} for system {review_project_id} to system {published_project_id}')

    try:
        service_client = service_account()

        # Check the transfer status
        transfer_status = _check_transfer_status(service_client, transfer_task_id)

        # Handle pending or in-progress transfer
        if transfer_status in ['PENDING', 'IN_PROGRESS']:
            logger.info(f'Transfer {transfer_task_id} is still pending with status {transfer_status}, retrying in 30 seconds.')
            self.apply_async(kwargs={
                'review_project_id': review_project_id,
                'published_project_id': published_project_id,
                'transfer_task_id': transfer_task_id
            }, countdown=30)
            return

        # Handle completed transfer
        elif transfer_status == 'COMPLETED':
            logger.info(f'Transfer {transfer_task_id} completed successfully for system {review_project_id} to system {published_project_id}')
            
            update_and_cleanup_review_project(review_project_id, PublicationRequest.Status.APPROVED)

            # Make system public for listing
            service_client.systems.shareSystemPublic(systemId=published_project_id)
        else:
            logger.error(f'Error processing transfer {transfer_task_id}: Transfer status is {transfer_status}')
            raise Exception(f'Transfer {transfer_task_id} failed with status {transfer_status}')
    
    except Exception as e:
        logger.error(f'Error processing transfer {transfer_task_id} for system {review_project_id} to system {published_project_id}: {e}')
        self.retry(exc=e, countdown=30)

