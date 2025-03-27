import os
import base64
import logging
from pathlib import Path
from django.conf import settings
from celery import shared_task
from django.db import transaction
from portal.apps.publications.models import PublicationRequest
from portal.libs.agave.utils import user_account
from portal.apps.projects.models.project_metadata import ProjectMetadata
from portal.apps._custom.drp import constants
from portal.apps.projects.workspace_operations.project_meta_operations import (
        add_file_associations, 
        create_file_obj, 
        get_file_obj, 
        get_ordered_value 
    )
from portal.apps.projects.workspace_operations.graph_operations import get_path_uuid_mapping
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

logger = logging.getLogger(__name__)

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
        Notification.EVENT_TYPE: 'projects',
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

        try:
            if file_ext in ['.tif', '.tiff']:
                adv_image = conf_tiff(file)
            else:
                adv_image = conf_raw(value, file)
        except Exception as e:
            logger.error(f'Could not generate advanced image for {file_name} due to error: {e}')

            Notification.objects.create(**{
                Notification.EVENT_TYPE: 'projects',
                Notification.STATUS: Notification.INFO,
                Notification.USER: username,
                Notification.MESSAGE: f'Failed to Generate Images for {Path(path).name}',
            })
            
            return

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
                Notification.EVENT_TYPE: 'projects',
                Notification.STATUS: Notification.INFO,
                Notification.USER: username,
                Notification.MESSAGE: f'Image generation complete. Please refresh the page.',
            })
    else: 
        print(f"File {path} does not exist in project {project_id}")
