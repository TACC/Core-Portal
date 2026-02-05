"""Publication views.

.. :module:: apps.publications.views
   :synopsis: Views to handle Publications
"""
import json
import logging
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from portal.exceptions.api import ApiException
from portal.views.base import BaseApiView
from portal.apps.projects.workspace_operations.shared_workspace_operations import create_publication_workspace
from portal.apps.projects.workspace_operations.project_publish_operations import copy_graph_and_files_for_review_system, publish_project, update_and_cleanup_review_project, send_publication_rejected_email_to_authors, send_publication_reviewed_email_to_reviewers
from portal.apps.projects.models.metadata import ProjectsMetadata
from django.db import transaction
from portal.apps.notifications.models import Notification
from django.http import HttpResponse
from portal.apps.publications.models import Publication, PublicationRequest
from portal.apps.projects.models.project_metadata import ProjectMetadata
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth import get_user_model
from portal.libs.agave.utils import service_account
from portal.libs.elasticsearch.docs.base import IndexedPublication
from elasticsearch_dsl import Q

logger = logging.getLogger(__name__)

class PublicationRequestView(BaseApiView):
         
    def get(self, request, project_id: str):
        
        if project_id:
            try:
                project = ProjectMetadata.get_project_by_id(project_id)
                
                publication_requests = PublicationRequest.objects.filter(
                     models.Q(source_project=project) | models.Q(review_project=project)
                )

                publication_requests_data = [
                    {
                        'id': pub_request.id,
                        'status': pub_request.status,
                        'comments': pub_request.comments,
                        'reviewers': [
                            {
                                'username': reviewer.username,
                                'email': reviewer.email,
                                'first_name': reviewer.first_name,
                                'last_name': reviewer.last_name,
                            }
                            for reviewer in pub_request.reviewers.all()
                        ],
                        'created_at': pub_request.created_at,
                        'last_updated': pub_request.last_updated
                    }
                    for pub_request in publication_requests
                ]
                
            except ProjectsMetadata.DoesNotExist:
                raise ApiException(f'Project {project_id} not found', status=404)
            
            return JsonResponse({'response': publication_requests_data}, safe=False)
        
        return JsonResponse({'response': []})

    @method_decorator(login_required, name='dispatch')
    def post(self, request):
        
        request_body = json.loads(request.body)

        client = request.user.tapis_oauth.client
        service_client = service_account()
        
        full_project_id = request_body.get('project_id')

        if not full_project_id:
            raise ApiException("Missing project ID", status=400)

        source_workspace_id = full_project_id.split(f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.")[1]
        review_workspace_id = f"{source_workspace_id}"
        source_system_id = f'{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.{source_workspace_id}'
        review_system_id = f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.{review_workspace_id}"

        with transaction.atomic():
            # Update authors for the source project
            # TODO: use pydantic to validate data
            source_project = ProjectMetadata.get_project_by_id(source_system_id)
            source_project.value['authors'] = request_body.get('authors')
            source_project.save()

        try:
            create_publication_workspace(client, source_workspace_id, source_system_id, review_workspace_id, 
                                            review_system_id, request_body.get('title'), request_body.get('description'), True)

            # Create publication request
            review_project = ProjectMetadata.get_project_by_id(review_system_id)
            source_project = ProjectMetadata.get_project_by_id(source_system_id)
            publication_reviewers = get_user_model().objects.filter(groups__name=settings.PORTAL_PUBLICATION_REVIEWERS_GROUP_NAME)

            publication_request = PublicationRequest(
                review_project=review_project,
                source_project=source_project,
            )

            publication_request.save()

            for reviewer in publication_reviewers:
                try:
                    publication_request.reviewers.add(reviewer)
                except ObjectDoesNotExist:
                    continue

            publication_request.save()
            logger.info(f'Created publication review for system {review_system_id}')

            # Start task to copy files and metadata
            copy_graph_and_files_for_review_system.apply_async(kwargs={
                'user_access_token': client.access_token.access_token, 
                'source_workspace_id': source_workspace_id,
                'review_workspace_id': review_workspace_id,
                'source_system_id': source_system_id, 
                'review_system_id': review_system_id
            })

            # Create notification 
            event_data = {
                    Notification.EVENT_TYPE: 'projects',
                    Notification.STATUS: Notification.INFO,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: f'{source_workspace_id} submitted for review',
                }
            
            with transaction.atomic():
                    Notification.objects.create(**event_data)
        except Exception as e:
            logger.error(f"Error creating publication workspace: {e}")

            # Create notification 
            event_data = {
                    Notification.EVENT_TYPE: 'projects',
                    Notification.STATUS: Notification.ERROR,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: f'{source_workspace_id} creation failed',
                }
            
            with transaction.atomic():
                    Notification.objects.create(**event_data)

        return JsonResponse({'response': 'OK'})

class PublicationListingView(BaseApiView):

    def get(self, request):
        
        query_string = request.GET.get('query_string')
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 100))
    
        if query_string:
            query = IndexedPublication.search()

            qs_query = Q(
                "query_string",
                # Elasticsearch can't parse query strings with unescaped slashes
                query=query_string.replace("/", "\\/"),
                default_operator="AND",
                type="cross_fields",
                fields=[
                    "nodes.value.doi",
                    "nodes.value.description",
                    "nodes.value.keywords",
                    "nodes.value.title",
                    "nodes.value.projectId",
                    "nodes.value.authors",
                    "nodes.value.authors.first_name",
                    "nodes.value.authors.last_name",
                    "nodes.value.authors.username",
                ],
            )
            term_query = Q(
                {
                    "term": {
                        "nodes.value.projectId.keyword": query_string.replace("/", "\\/")
                    }
                }
            )

            query = query.filter(qs_query | term_query)
            query = query.extra(from_=int(offset), size=int(limit))

            res = query.execute()
            hits = [hit.meta.id for hit in res if hasattr(hit.meta, 'id') and hit.meta.id is not None]

            if hits: 
                publications = (
                     Publication.objects.filter(project_id__in=hits, is_published=True)
                    .defer("tree")
                    .order_by("-created")
                )
            else:
                publications = Publication.objects.none()
        else:
            publications = Publication.objects.filter(is_published=True).order_by("-created")
        
        publications_data = []
        for publication in publications:
            publication_data = {
                'id': publication.value.get('projectId'),
                'title': publication.value.get('title'),
                'description': publication.value.get('description'),
                'keywords': publication.value.get('keywords'),
                'authors': publication.value.get('authors'),
                'publication_date': publication.created,
            }

            try:
                project_meta = ProjectMetadata.objects.get(models.Q(value__projectId=publication.value.get('projectId')))

                if project_meta.value.get('coverImage'):
                    publication_data['cover_image'] = project_meta.value['coverImage']
                else:
                    publication_data['cover_image'] = 'media/default/cover_image/default_logo.png'
            except ProjectMetadata.DoesNotExist:
                pass

            publications_data.append(publication_data)
        
        return JsonResponse({'response': publications_data}, safe=False)

class PublicationPublishView(BaseApiView):
     
     def post(self, request):
        """view for publishing a project"""

        client = request.user.tapis_oauth.client
        request_body = json.loads(request.body)

        full_project_id = request_body.get('project_id')
        is_review = request_body.get('is_review_project', False)

        if not full_project_id:
            raise ApiException("Missing project ID", status=400)
        
        if is_review:
            project_id = full_project_id.split(f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.")[1]
        else: 
            project_id = full_project_id.split(f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.")[1]

        source_system_id = f'{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.{project_id}'
        published_workspace_id = f"{project_id}"
        published_system_id = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{published_workspace_id}"

        try:
            create_publication_workspace(client, project_id, source_system_id, published_workspace_id, published_system_id, 
                                     request_body.get('title'), request_body.get('description'), False)

            publish_project.apply_async(kwargs={
                'project_id': project_id,
                'version': 1
            })

            # Create notification 
            event_data = {
                    Notification.EVENT_TYPE: 'projects',
                    Notification.STATUS: Notification.INFO,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: f'{project_id} submitted for publication',
                }
            
            with transaction.atomic():
                    Notification.objects.create(**event_data)
        except Exception as e:
            logger.error(f"Error creating publication workspace: {e}")
        
            # Create notification 
            event_data = {
                    Notification.EVENT_TYPE: 'projects',
                    Notification.STATUS: Notification.ERROR,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: f'{project_id} publication failed',
                }
            
            with transaction.atomic():
                    Notification.objects.create(**event_data)

        return JsonResponse({'response': 'OK'})


class PublicationVersionView(BaseApiView):

    def post(self, request):
        """view for publishing a project"""

        client = request.user.tapis_oauth.client
        request_body = json.loads(request.body)

        full_project_id = request_body.get('project_id')
        is_review = request_body.get('is_review_project', False)
        
        if not full_project_id:
            raise ApiException("Missing project ID", status=400)
        
        if is_review:
            project_id = full_project_id.split(f"{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.")[1]
        else: 
            project_id = full_project_id.split(f"{settings.PORTAL_PROJECTS_SYSTEM_PREFIX}.")[1]

        print('project_id:', project_id)

        publication = Publication.objects.get(project_id=project_id)
        version = publication.version + 1

        print(f"Version: {version}")

        source_system_id = f'{settings.PORTAL_PROJECTS_REVIEW_SYSTEM_PREFIX}.{project_id}'
        published_workspace_id = f"{project_id}{f'v{version}' if version and version > 1 else ''}"
        published_system_id = f"{settings.PORTAL_PROJECTS_PUBLISHED_SYSTEM_PREFIX}.{published_workspace_id}"

        print(f"Published Workspace ID: {published_workspace_id}")

        try:
            create_publication_workspace(client, project_id, source_system_id, published_workspace_id, published_system_id, 
                                        request_body.get('title'), request_body.get('description'), False)
            
            publish_project.apply_async(kwargs={
                'project_id': project_id,
                'version': version
            })

            # Create notification 
            event_data = {
                    Notification.EVENT_TYPE: 'projects',
                    Notification.STATUS: Notification.INFO,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: f'{project_id} submitted for publication',
                }
            
            with transaction.atomic():
                    Notification.objects.create(**event_data)
        except Exception as e:
            logger.error(f"Error creating publication workspace: {e}")
        
            # Create notification 
            event_data = {
                    Notification.EVENT_TYPE: 'projects',
                    Notification.STATUS: Notification.ERROR,
                    Notification.USER: request.user.username,
                    Notification.MESSAGE: f'{project_id} publication failed',
                }
            
            with transaction.atomic():
                    Notification.objects.create(**event_data)

        return JsonResponse({'response': 'OK'})

class PublicationRejectView(BaseApiView):

    def post(self, request):
        
        request_body = json.loads(request.body)
        full_project_id = request_body.get('project_id')

        if not full_project_id:
            raise ApiException("Missing project ID", status=400)
        
        if not settings.DEBUG:
            send_publication_rejected_email_to_authors.apply_async(args=[full_project_id])
            send_publication_reviewed_email_to_reviewers.apply_async(args=[full_project_id, 'REJECTED', request.user.username])
        
        update_and_cleanup_review_project(full_project_id, PublicationRequest.Status.REJECTED)

        # Create notification 
        event_data = {
                Notification.EVENT_TYPE: 'projects',
                Notification.STATUS: Notification.INFO,
                Notification.USER: request.user.username,
                Notification.MESSAGE: f'{full_project_id} was rejected',
            }
        
        with transaction.atomic():
                Notification.objects.create(**event_data)

        return JsonResponse({'response': 'OK'})