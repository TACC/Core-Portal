from typing import Optional
from django.conf import settings
import logging
import json
from io import StringIO
from portal.apps.projects.workspace_operations.shared_workspace_operations import remove_user
from portal.apps.projects.models.project_metadata import ProjectMetadata
import networkx as nx
from celery import shared_task
from portal.apps._custom.drp import constants
from portal.libs.agave.utils import user_account, service_account
from portal.apps.publications.models import Publication, PublicationRequest
from portal.apps.projects.workspace_operations.datacite_operations import get_datacite_json, upsert_datacite_json, publish_datacite_doi
from django.db import transaction
from portal.apps.projects.workspace_operations.graph_operations import remove_trash_nodes
from portal.apps.search.tasks import index_publication
from tapipy.errors import NotFoundError, BaseTapyException
from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

def _transfer_files(client, source_system_id, dest_system_id):

    service_client = service_account()

    source_system_files = client.files.listFiles(systemId=source_system_id, path='/')

    # Filter out the trash folder
    filtered_files = [file for file in source_system_files if file.name != settings.TAPIS_DEFAULT_TRASH_NAME]

    transfer_elements = [
        {
            'sourceURI': file.url,
            'destinationURI': f'tapis://{dest_system_id}/{file.path}'
        }
        for file in filtered_files
    ]

    transfer = service_client.files.createTransferTask(elements=transfer_elements)
    return transfer

def _transfer_cover_image(source_system_id, dest_system_id, cover_image_path):
    
    if not cover_image_path:
        logger.info('No cover image found for project, skipping transfer.')
        return None
    
    service_client = service_account()

    # Transfer the cover image to the destination system
    transfer_elements = [
        {
            'sourceURI': f'tapis://{source_system_id}/{cover_image_path}',
            'destinationURI': f'tapis://{dest_system_id}/{cover_image_path}'
        }
    ]

    transfer = service_client.files.createTransferTask(elements=transfer_elements)
    logger.info(f"Transfer task created for cover image: {transfer.uuid}")
    return transfer

def _check_transfer_status(service_client, transfer_task_id):
    transfer_details = service_client.files.getTransferTask(transferTaskId=transfer_task_id)
    return transfer_details.status

def _add_values_to_tree(project_id):
    project_meta = ProjectMetadata.get_project_by_id(project_id)
    prj_entities = ProjectMetadata.get_entities_by_project_id(project_id)
    
    entity_map = {entity.uuid: entity for entity in prj_entities}

    publication_tree: nx.DiGraph = nx.node_link_graph(project_meta.project_graph.value)

    publication_tree = remove_trash_nodes(publication_tree)

    for node_id in publication_tree:
        uuid = publication_tree.nodes[node_id]["uuid"]
        if uuid is not None:
            publication_tree.nodes[node_id]["value"] = entity_map[uuid].value
            publication_tree.nodes[node_id]["uuid"] = None  # Clear the uuid field

    return publication_tree

def publish_project_callback(review_project_id, published_project_id, archive_project_id):
        service_client = service_account()
        update_and_cleanup_review_project(review_project_id, PublicationRequest.Status.APPROVED)

        # Make system public for listing
        service_client.systems.shareSystemPublic(systemId=published_project_id)

        # Create ZIP archive of published files
        archive_publication_files(archive_project_id)

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

def upload_metadata_file(project_id: str, project_json: str):
    """
    Upload the metadata file for a project. The uploaded file will appear at:
    tapis://{PUBLISHED_ROOT_SYSTEM}/archive/{PROJECT_ID}_metadata.json 
    """
    published_root = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    upload_name = f"{project_id}_metadata.json"
    upload_full_path = f"/archive/{project_id}/{upload_name}"
    client = service_account()
    client.files.mkdir(systemId=published_root, path=f"/archive/{project_id}")
    with StringIO() as f:
        json.dump(project_json, f, ensure_ascii=False, indent=4)
        f.seek(0)
        f.name = upload_name
        client.files.insert(systemId=published_root, path=upload_full_path, file=f)
    logger.debug("Created metadata file for %s at tapis://%s/%s", project_id, published_root, upload_full_path)

def archive_publication_files(project_id: str):
    """
    Run a Tapis job to create a ZIP archive of published files that includes metadata.
    """

    client = service_account()
    published_root_system = settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME
    published_root_dir = client.systems.getSystem(systemId=published_root_system).rootDir

    job_body = {
        "name": f"drp-archive-publication-{project_id}",
        "appId": "digitalrocks-archive-publication",
        "appVersion": "0.0.1",
        "description": "Archive DRP publication",
        "fileInputs": [],
        "parameterSet": {
            "appArgs": [],
            "schedulerOptions": [],
            "envVariables": [
                {
                    "key": "publishedRootDir",
                    "value": published_root_dir
                },
                {
                    "key": "projectId",
                    "value": project_id
                }
            ],
        },
        "tags": ["portalName:drp"],
    }
    res = client.jobs.submitJob(**job_body)
    return res

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

        source_project_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{project_id}'
        source_project = ProjectMetadata.get_project_by_id(source_project_id)

        try:
            # Mint a DataCite DOI
            existing_doi = source_project.value.get("doi", None)
            logger.info(f'Attempting to mint DataCite DOI for project {project_id}, existing DOI: {existing_doi}')

            datacite_json = get_datacite_json(publication_tree)
            datacite_resp = upsert_datacite_json(datacite_json, doi=existing_doi)
            doi = datacite_resp["data"]["id"]
            logger.info(f'Successfully minted DataCite DOI for project {project_id}: {doi}')
        except Exception as e:
            logger.error(f'Error minting DataCite DOI for project {project_id}: {e}')
            raise Exception(f'Error minting DOI for project {project_id}: {e}')
            

        # Update project metadata with datacite doi
        source_project.value['doi'] = doi
        source_project.value['publicationDate'] = published_project.created
        source_project.save()

        pub_tree = nx.node_link_graph(published_project.project_graph.value)
        pub_tree.nodes["NODE_ROOT"]["version"] = version
        published_project.project_graph.value = nx.node_link_data(pub_tree)
        published_project.value['doi'] = doi
        published_project.value['publicationDate'] = published_project.created
        published_project.save()


        pub_metadata, _ = Publication.objects.update_or_create(
            project_id=project_id,
            defaults={"value": published_project.value, "tree": nx.node_link_data(pub_tree), "version": version},
        )

        if not settings.DEBUG:
            try:
                publish_datacite_doi(doi)
            except Exception as e:
                logger.error(f'Error publishing DataCite DOI for project {project_id}: {e}')
                raise Exception(f'Error publishing DOI for project {project_id}: {e}')

        upload_metadata_file(published_workspace_id, pub_metadata.tree)

        index_publication(project_id)

        # transfer files 
        client = service_account()
        transfer = _transfer_files(client, review_system_id, published_system_id)
        cover_image_transfer = _transfer_cover_image(settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME, 
                                                     settings.PORTAL_PROJECTS_PUBLISHED_ROOT_SYSTEM_NAME, 
                                                     project_meta.value.get("coverImage", None))

        poll_tapis_file_transfer.apply_async(
            args=(transfer.uuid, False),
            kwargs={
            'review_project_id': review_system_id,
            'published_project_id': published_system_id,
            'archive_project_id': published_workspace_id
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
        cover_image_trasnfer = _transfer_cover_image(settings.PORTAL_PROJECTS_ROOT_SYSTEM_NAME, 
                                                     settings.PORTAL_PROJECTS_ROOT_REVIEW_SYSTEM_NAME, 
                                                     review_project.value.get("coverImage", None))

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

def get_project_user_emails(project_id):
    """Return a list of emails for users in a project."""
    prj = ProjectMetadata.get_project_by_id(project_id)
    return [user["email"] for user in prj.value["authors"] if user.get("email")]

@shared_task(bind=True, queue='default')
def send_publication_accept_email(self, project_id):
    """
    Alert project authors that their request has been accepted.
    """
    user_emails = get_project_user_emails(project_id)
    for user_email in user_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                Congratulations! The following project has been accepted for publication:
                <br/>
                <b>{project_id}</b>
                <br/>
            </p>
            <p>
            Your publication should appear in the portal within 1 business day.
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            "DigitalRocks Alert: Your Publication Request has been Accepted",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            html_message=email_body,
        )

@shared_task(bind=True, queue='default')
def send_publication_reject_email(self, project_id: str):
    """
    Alert project authors that their request has been rejected.
    """
    user_emails = get_project_user_emails(project_id)
    for user_email in user_emails:
        email_body = f"""
            <p>Hello,</p>
            <p>
                The following project has been rejected by a reviewer and cannot be published at this time:
                <br/>
                <b>{project_id}</b>
                <br/>
            </p>
            <p>
            You are welcome to revise this project and re-submit for publication.
            </p>

            This is a programmatically generated message. Do NOT reply to this message.
            """

        send_mail(
            "DigitalRocks Alert: Your Publication Request has been Rejected",
            email_body,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            html_message=email_body,
        )