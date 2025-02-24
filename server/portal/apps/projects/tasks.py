import os
import base64
import logging
from pathlib import Path
from django.conf import settings
from celery import shared_task
from django.db import transaction
from portal.apps.publications.models import PublicationRequest
from portal.libs.agave.utils import user_account, service_account
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp import constants
from portal.apps.projects.workspace_operations.project_meta_operations import (
        add_file_associations, 
        create_file_obj, 
        get_file_obj, 
        get_ordered_value 
    )
from portal.apps.projects.workspace_operations.graph_operations import get_path_uuid_mapping
import networkx as nx
from portal.apps._custom.drp.models import FileObj
from portal.libs.files.file_processing import ( 
        binary_correction, 
        conf_raw, 
        conf_tiff, 
        create_animation, 
        create_histogram, 
        create_thumbnail 
    )
from portal.apps.notifications.models import Notification

# TODO: Cleanup this file

logger = logging.getLogger(__name__)

def _transfer_files(user_access_token, source_system_id, review_system_id):
    user_client = user_account(user_access_token)
    service_client = service_account()

    source_system_files = user_client.files.listFiles(systemId=source_system_id, path='/')

    transfer_elements = [
        {
            'sourceURI': file.url,
            'destinationURI': f'tapis://{review_system_id}/{file.path}'
        }
        for file in source_system_files
    ]

    transfer = service_client.files.createTransferTask(elements=transfer_elements)
    return transfer

def _check_transfer_status(service_client, transfer_task_id):
    transfer_details = service_client.files.getTransferTask(transferTaskId=transfer_task_id)
    return transfer_details.status

def _create_publication_request(review_system_id, source_system_id, publication_reviewers):
    review_project = ProjectMetadata.get_project_by_id(review_system_id)
    source_project = ProjectMetadata.get_project_by_id(source_system_id)

    publication_request = PublicationRequest(
        review_project=review_project,
        source_project=source_project,
    )

    publication_request.save()

    for reviewer in publication_reviewers:
        try:
            user = get_user_model().objects.get(username=reviewer)
            publication_request.reviewers.add(user)
        except ObjectDoesNotExist:
            continue

    publication_request.save()
    logger.info(f'Created publication review for system {review_system_id}')

def _remove_admin_from_workspace(user_client, source_system_id, source_workspace_id, portal_admin_username):
    user_client.systems.unShareSystem(systemId=source_system_id, users=[portal_admin_username])
    user_client.systems.revokeUserPerms(systemId=source_system_id, userName=portal_admin_username, permissions=["READ", "MODIFY", "EXECUTE"])
    user_client.files.deletePermissions(systemId=source_system_id, username=portal_admin_username, path="/")
    logger.info(f'Removed service account from workspace {source_workspace_id}')

def _add_reviewers_to_workspace(service_client, review_workspace_id, publication_reviewers, review_system_id):

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

def _handle_completed_transfer(user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id, publication_reviewers):
    service_client = service_account()
    user_client = user_account(user_access_token)
    portal_admin_username = settings.PORTAL_ADMIN_USERNAME

    with transaction.atomic():
        # Create publication request
        _create_publication_request(review_system_id, source_system_id, publication_reviewers)

        # Remove admin from source workspace
        _remove_admin_from_workspace(user_client, source_system_id, source_workspace_id, portal_admin_username)

        # Add reviewers to review workspace
        _add_reviewers_to_workspace(service_client, review_workspace_id, publication_reviewers, review_system_id)

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

@shared_task(bind=True, max_retries=3, queue='default')
def copy_graph_and_files(self, user_access_token, source_workspace_id, review_workspace_id, source_system_id, review_system_id):
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

        transfer = _transfer_files(user_access_token, source_system_id, review_system_id)

        logger.info(f'Transfer task submmited with id {transfer.uuid}')

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

    try:
        service_client = service_account()
        publication_reviewers = settings.PUBLICATION_REVIEWERS

        # Check the transfer status
        transfer_status = _check_transfer_status(service_client, transfer_task_id)

        # Handle pending or in-progress transfer
        if transfer_status in ['PENDING', 'IN_PROGRESS']:
            logger.info(f'Transfer {transfer_task_id} is still pending with status {transfer_status}, retrying in 30 seconds.')
            self.apply_async(kwargs={
                'user_access_token': user_access_token,
                'source_workspace_id': source_workspace_id,
                'review_workspace_id': review_workspace_id,
                'source_system_id': source_system_id,
                'review_system_id': review_system_id,
                'transfer_task_id': transfer_task_id
            }, countdown=30)
            return

        # Handle completed transfer
        elif transfer_status == 'COMPLETED':
            logger.info(f'Transfer {transfer_task_id} completed successfully for system {source_system_id} to system {review_system_id}')
            _handle_completed_transfer(
                user_access_token,
                source_workspace_id,
                review_workspace_id,
                source_system_id,
                review_system_id,
                publication_reviewers
            )
        else:
            logger.error(f'Error processing transfer {transfer_task_id}: Transfer status is {transfer_status}')
            raise Exception(f'Transfer {transfer_task_id} failed with status {transfer_status}')
    
    except Exception as e:
        logger.error(f'Error processing transfer {transfer_task_id} for system {source_system_id} to system {review_system_id}: {e}')
        self.retry(exc=e, countdown=30)


@shared_task(bind=True, max_retries=3, queue='default')
def sync_files_without_metadata(self, user_access_token, project_id: str):
    client = user_account(user_access_token)

    path_uuid_map = get_path_uuid_mapping(project_id)
    tapis_files_listing = client.files.listFiles(systemId=project_id, path='/', recurse=True)
    files = [file for file in tapis_files_listing if file.type != 'dir']

    required_uuids = set(path_uuid_map.values())

    # Cache to avoid repeated database queries for the same parent path
    entity_cache = {
        entity.uuid: entity for entity in ProjectMetadata.objects.filter(uuid__in=required_uuids)
    }

    files_to_add_dict = {}

    for file in files: 
        file_path = file.path
        parent_path = str(Path(file_path).parent)

        if parent_path == '.':
            parent_path = ''

        # Check if the parent path exists in path_uuid_map
        if parent_path not in path_uuid_map:
            continue

        # Fetch the cached entity
        parent_uuid = path_uuid_map[parent_path]
        entity = entity_cache.get(parent_uuid)

        if not entity:
            logger.warning(f"Parent entity {parent_uuid} for file {file_path} does not exist")
            continue

        entity_value = get_ordered_value(entity.name, entity.value)
        file_objs = entity_value.get('file_objs', [])
        file_paths_set = {file_obj.get('path') for file_obj in file_objs}

        if file_path not in file_paths_set:
            new_file_obj = create_file_obj(project_id, file.name, file.size, file_path, {'data_type': 'file'})
            files_to_add_dict[entity.uuid] = files_to_add_dict.get(entity.uuid, []) + [new_file_obj]

    for entity_uuid, file_objs in files_to_add_dict.items():
        logger.info(f'Adding {len(file_objs)} files to entity {entity_uuid} in project {project_id}')
        add_file_associations(entity_uuid, file_objs)

@shared_task(bind=True, queue='default')
def process_file(self, project_id: str, path: str, user_access_token: str, encoded_file=None):

    client = user_account(user_access_token)
    username = client.access_token.claims['tapis/username']

    Notification.objects.create(**{
        Notification.EVENT_TYPE: 'default',
        Notification.STATUS: Notification.INFO,
        Notification.USER: username,
        Notification.MESSAGE: f'Generating Images for {Path(path).name}',
    })

    logger.info(f'Processing file {path} in project {project_id}')

    if encoded_file:
        logger.info('Decoding file')
        file = base64.b64decode(encoded_file)
    else:
        logger.info('Retrieving file using Tapis')
        file = client.files.getContents(systemId=project_id, path=path)
    
    logger.info('File retrieved')

    parent_path = str(Path(path).parent)

    file_obj: FileObj = get_file_obj(project_id, path)

    if file and file_obj: 
        value = get_ordered_value(constants.FILE, file_obj.get('value'))

        file_name = file_obj.get('name')

        _, file_ext = os.path.splitext(file_obj.get('name'))

        if file_ext in ['.tif', '.tiff']:
            adv_image = conf_tiff(file)
        else:
            adv_image = conf_raw(value, file)

        try:
            if value.get('use_binary_correction'):
                adv_image = binary_correction(adv_image)
        except Exception as e:
            logger.error(f'Error applying binary correction: {e}')

        try:
            thumbnail = create_thumbnail(adv_image)

            thumbnail_path = f'{parent_path}/{file_name}.thumb.jpg'

            logger.info('Uploading generated thumbnail')
            client.files.insert(systemId=project_id, path=thumbnail_path, file=thumbnail)
        except Exception as e: 
            logger.error(f'Error generating thumbnail: {e}')

        try:
            histogram_img, histogram_csv = create_histogram(adv_image)

            histogram_img_path = f'{parent_path}/{file_name}.histogram.jpg'
            histogram_csv_path = f'{parent_path}/{file_name}.histogram.csv'

            logger.info('Uploading generated histogram')
            client.files.insert(systemId=project_id, path=histogram_img_path, file=histogram_img)
            client.files.insert(systemId=project_id, path=histogram_csv_path, file=histogram_csv)
        except Exception as e: 
            logger.error(f'Error generating histogram: {e}')

        try:
            animation = create_animation(adv_image)

            animation_path = f'{parent_path}/{file_name}.gif'

            logger.info('Uploading generated animation')
            client.files.insert(systemId=project_id, path=animation_path, file=animation)
        except Exception as e: 
            logger.error(f'Error generating animation: {e}')

        with transaction.atomic():
            Notification.objects.create(**{
                Notification.EVENT_TYPE: 'default',
                Notification.STATUS: Notification.INFO,
                Notification.USER: username,
                Notification.MESSAGE: f'Image generation complete. Please refresh the page.',
            })
    else: 
        print(f"File {path} does not exist in project {project_id}")
