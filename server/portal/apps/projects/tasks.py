import logging
from django.conf import settings
from celery import shared_task
from django.db import transaction
from portal.apps.projects.models.metadata import ProjectsMetadata
from portal.apps.publications.models import PublicationRequest
from portal.apps.datafiles.models import DataFilesMetadata
from portal.apps import SCHEMA_MAPPING
from portal.libs.agave.utils import user_account, service_account
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, queue='default')
def copy_files_and_metadata(self, user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id):

    logger.info(f'Starting copy task for system {source_system_id} to system {review_system_id}')

    with transaction.atomic(): 
        # do a system file listing at the root using the client. This will be the list of files to copy

        user_client = user_account(user_access_token)
        service_client = service_account()

        source_system_files = user_client.files.listFiles(systemId=source_system_id, path='/')
        source_system_files_metadata = DataFilesMetadata.objects.filter(project_id=source_system_id).order_by('created_at')
        review_project = ProjectsMetadata.objects.get(project_id=review_system_id)

        # create new metadata records for each file in the listing
        for metadata in source_system_files_metadata: 
            review_system_file_metadata = DataFilesMetadata(
                name = metadata.name,
                path = f'{review_system_id}/{metadata.path.split("/", 1)[-1]}',
                metadata = metadata.metadata,
                project = review_project
            )

            review_system_file_metadata.save()

        # create transfer object for tapis file copy
        transfer_elements = [
            {
                'sourceURI': file.url,
                'destinationURI': f'tapis://{review_system_id}/{file.path}'
            }
            for file in source_system_files
        ]
        
        transfer = service_client.files.createTransferTask(elements=transfer_elements)

        copy_result = {
            'uuid': transfer.uuid,
            'status': transfer.status
        }

        logger.info(f'Created transfer task {transfer.uuid} for system {source_system_id} to system {review_system_id}')

        post_file_transfer.apply_async(kwargs={
            'user_access_token': user_access_token, 
            'source_workspace_id': source_workspace_id,
            'review_workspace_id': review_workspace_id,
            'source_system_id': source_system_id, 
            'review_system_id': review_system_id,
            'transfer_task_id': transfer.uuid
        }, countdown=30)


@shared_task(bind=True, max_retries=3, queue='default')
def post_file_transfer(self, user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id, transfer_task_id):

    logger.info(f'Starting post transfer task for transfer id {transfer_task_id} for system {source_system_id} to system {review_system_id}')

    user_client = user_account(user_access_token)
    service_client = service_account()
    portal_admin_username = settings.PORTAL_ADMIN_USERNAME
    publication_reviewers = settings.PUBLICATION_REVIEWERS

    transfer_complete = False
    transfer_status = 'PENDING'

    while not transfer_complete:
        # check the status of the transfer task
        transfer_details = service_client.files.getTransferTask(transferTaskId=transfer_task_id)
        transfer_status = transfer_details.status

        if transfer_status in ['COMPLETED', 'FAILED']:
            transfer_complete = True
        else:
            # Schedule this task to run again after 30 seconds if the transfer is still pending
            self.apply_async(kwargs={
                    'user_access_token': user_access_token, 
                    'source_workspace_id': source_workspace_id,
                    'review_workspace_id': review_workspace_id,
                    'source_system_id': source_system_id, 
                    'review_system_id': review_system_id,
                    'transfer_task_id': transfer_task_id
                }, countdown=30)
            
            return
        
    if transfer_status == 'COMPLETED':
        from portal.apps.projects.workspace_operations.shared_workspace_operations import add_user_to_workspace

        with transaction.atomic():
            # create a publication review object
            review_project = ProjectsMetadata.objects.get(project_id=review_system_id)
            source_project = ProjectsMetadata.objects.get(project_id=source_system_id)

            publication_request = PublicationRequest(
                review_project = review_project,
                source_project = source_project,
            )

            publication_request.save()

            for reviewer in publication_reviewers:
                user = get_user_model().objects.get(username=reviewer)
                publication_request.reviewers.add(user)
            
            publication_request.save()

            logger.info(f'Created publication review for system {review_system_id}')

            # remove the service account from the source workspace
            user_client.systems.unShareSystem(systemId=source_system_id, users=[portal_admin_username])
            user_client.systems.revokeUserPerms(systemId=source_system_id,
                                        userName=portal_admin_username,
                                        permissions=["READ", "MODIFY", "EXECUTE"])
            user_client.files.deletePermissions(systemId=source_system_id,
                                        username=portal_admin_username,
                                        path="/")
            logger.info(f'Removed service account from workspace {source_workspace_id}')

            # add the reviewers to the review workspace
            for reviewer in publication_reviewers:
                add_user_to_workspace(service_client, review_workspace_id, reviewer, "reader")
                logger.info(f'Added reviewer {reviewer} to review system {review_system_id}')

