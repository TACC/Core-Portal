from typing import Optional
from django.conf import settings
import logging
from portal.apps.projects.workspace_operations.shared_workspace_operations import remove_user
from portal.apps.projects.models.project_metadata import ProjectMetadata
import networkx as nx
from celery import shared_task

from portal.apps._custom.drp import constants
from portal.libs.agave.utils import user_account, service_account
from portal.apps.publications.models import Publication, PublicationRequest
from django.db import transaction
from tapipy.errors import NotFoundError, BaseTapyException
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist

logger = logging.getLogger(__name__)

def _transfer_files(client, source_system_id, dest_system_id):

    service_client = service_account()

    source_system_files = client.files.listFiles(systemId=source_system_id, path='/')

    transfer_elements = [
        {
            'sourceURI': file.url,
            'destinationURI': f'tapis://{dest_system_id}/{file.path}'
        }
        for file in source_system_files
    ]

    transfer = service_client.files.createTransferTask(elements=transfer_elements)
    return transfer

def _check_transfer_status(service_client, transfer_task_id):
    transfer_details = service_client.files.getTransferTask(transferTaskId=transfer_task_id)
    return transfer_details.status

def _add_values_to_tree(project_id):
    project_meta = ProjectMetadata.get_project_by_id(project_id)
    prj_entities = ProjectMetadata.get_entities_by_project_id(project_id)
    
    entity_map = {entity.uuid: entity for entity in prj_entities}

    publication_tree: nx.DiGraph = nx.node_link_graph(project_meta.project_graph.value)
    for node_id in publication_tree:
        uuid = publication_tree.nodes[node_id]["uuid"]
        if uuid is not None:
            publication_tree.nodes[node_id]["value"] = entity_map[uuid].value
            publication_tree.nodes[node_id]["uuid"] = None  # Clear the uuid field

    return publication_tree

def publish_project_callback(review_project_id, published_project_id):
        service_client = service_account()
        update_and_cleanup_review_project(review_project_id, PublicationRequest.Status.APPROVED)

        # Make system public for listing
        service_client.systems.shareSystemPublic(systemId=published_project_id)

def publication_request_callback(user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id):
    service_client = service_account()
    user_client = user_account(user_access_token)
    portal_admin_username = settings.PORTAL_ADMIN_USERNAME

    publication_reviewers = get_user_model().objects.filter(groups__name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME).values_list('username', flat=True)

    with transaction.atomic():
        # Remove admin from source workspace
        user_client.systems.unShareSystem(systemId=source_system_id, users=[portal_admin_username])
        user_client.systems.revokeUserPerms(systemId=source_system_id, userName=portal_admin_username, permissions=["READ", "MODIFY", "EXECUTE"])
        user_client.files.deletePermissions(systemId=source_system_id, username=portal_admin_username, path="/")
        logger.info(f'Removed service account from workspace {source_workspace_id}')

        # Add reviewers to review workspace
        from portal.apps.projects.workspace_operations.shared_workspace_operations import add_user_to_workspace

        for reviewer in publication_reviewers:
            add_user_to_workspace(
                service_client,
                review_workspace_id,
                reviewer,
                "reader",
                f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.{review_workspace_id}",
                settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME,
            )
            logger.info(f'Added reviewer {reviewer} to review system {review_system_id}')

@shared_task(bind=True, max_retries=3, queue='default')
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
        client = service_account()
        transfer = _transfer_files(client, review_system_id, published_system_id)

        poll_tapis_file_transfer.apply_async(
            args=(transfer.uuid, False),
            kwargs={
            'review_project_id': review_system_id,
            'published_project_id': published_system_id,
        }, countdown=30)

@shared_task(bind=True, max_retries=3, queue='default')
def copy_graph_and_files_for_review_system(self, user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id):    
    logger.info(f'Starting copy task for system {source_system_id} to system {review_system_id}')

    with transaction.atomic():
        pub_tree = _add_values_to_tree(source_system_id)

        graph_model_value = nx.node_link_data(pub_tree)
        review_project = ProjectMetadata.get_project_by_id(review_system_id)
        ProjectMetadata.objects.update_or_create(
            name=constants.PROJECT_GRAPH,
            base_project=review_project,
            defaults={"value": graph_model_value},
        )

        client = user_account(user_access_token)
        transfer = _transfer_files(client, source_system_id, review_system_id)

        logger.info(f'Transfer task submmited with id {transfer.uuid}')

        poll_tapis_file_transfer.apply_async(
            args=(transfer.uuid, True),
            kwargs={
            'user_access_token': user_access_token,
            'source_workspace_id': source_workspace_id,
            'review_workspace_id': review_workspace_id,
            'source_system_id': source_system_id,
            'review_system_id': review_system_id,
        }, countdown=30)

@shared_task(bind=True, queue='default')
def poll_tapis_file_transfer(self, transfer_task_id, is_review, **kwargs):
    logger.info(f'Starting post transfer task for transfer id {transfer_task_id} with arguments: {kwargs}')

    try:
        service_client = service_account()

        # Check the transfer status
        transfer_status = _check_transfer_status(service_client, transfer_task_id)

        # Handle pending or in-progress transfer
        if transfer_status in ['PENDING', 'IN_PROGRESS']:
            logger.info(f'Transfer {transfer_task_id} is still pending with status {transfer_status}, retrying in 30 seconds.')
            self.apply_async(args=(transfer_task_id, is_review), kwargs=kwargs, countdown=30)
            return

        # Handle completed transfer
        elif transfer_status == 'COMPLETED':
            logger.info(f'Transfer {transfer_task_id} completed successfully with arguments: {kwargs}')
            
            # Call the callback function with any passed arguments
            if is_review:
                publication_request_callback(**kwargs)
            else: 
                publish_project_callback(**kwargs)

        else:
            logger.error(f'Error processing transfer {transfer_task_id}: Transfer status is {transfer_status}')
            raise Exception(f'Transfer {transfer_task_id} failed with status {transfer_status}')
    
    except Exception as e:
        logger.error(f'Error processing transfer {transfer_task_id} with arguments {kwargs}: {e}')
        self.retry(exc=e, countdown=30)
    
@transaction.atomic
def update_and_cleanup_review_project(review_project_id: str, status: PublicationRequest.Status):

    client = service_account()

    workspace_id = review_project_id.split(f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.")[1]

    # update the publication request 
    review_project = ProjectMetadata.get_project_by_id(review_project_id)
    pub_request = PublicationRequest.objects.get(review_project=review_project, status=PublicationRequest.Status.PENDING)
    pub_request.status = status
    pub_request.save()

    logger.info(f'Updated publication request for review project {review_project_id} to {status}.')

    # delete the review project and data inside it
    reviewers = pub_request.reviewers.all()

    for reviewer in reviewers:
        try:
            remove_user(client, workspace_id, reviewer.username, review_project_id, settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME)
            logger.info(f'Removed reviewer {reviewer.username} from review system {review_project_id}')
        except: 
            logger.error(f'Error removing reviewer {reviewer.username} from review system {review_project_id}')
            continue

    client.files.delete(systemId=review_project_id, path='/')
    client.systems.deleteSystem(systemId=review_project_id)
    review_project_graph = ProjectMetadata.objects.get(name=constants.PROJECT_GRAPH, base_project=review_project)
    review_project_graph.delete()
    review_project.delete()

    logger.info(f'Deleted review project {review_project_id} and its associated data.')